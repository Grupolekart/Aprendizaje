'use client';

import React, { useMemo, useRef, useState } from "react";
import { Sun, Moon, Upload, Eye, Download, CheckCircle2, AlertCircle } from "lucide-react";
import { BarChart as RCBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RCPieChart, Pie, Cell, Legend } from "recharts";

const Button = ({ children, className = "", variant = "default", ...props }) => {
  const base = "px-3 py-2 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2";
  const style =
    variant === "ghost"
      ? "bg-transparent hover:bg-black/5 dark:hover:bg-white/10"
      : variant === "secondary"
      ? "bg-gray-200 text-gray-800 hover:bg-gray-300 dark:bg-white/10 dark:text-white dark:hover:bg-white/20"
      : "bg-blue-600 text-white hover:bg-blue-700";
  return (
    <button className={`${base} ${style} ${className}`} {...props}>
      {children}
    </button>
  );
};

const Card = ({ className = "", children }) => (
  <div className={`bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl ${className}`}>{children}</div>
);
const CardHeader = ({ className = "", children }) => <div className={`p-4 border-b border-gray-200 dark:border-white/10 ${className}`}>{children}</div>;
const CardTitle = ({ className = "", children }) => <div className={`text-lg font-semibold ${className}`}>{children}</div>;
const CardContent = ({ className = "", children }) => <div className={`p-4 ${className}`}>{children}</div>;

export default function InformeFinancieroApp() {
  const [dark, setDark] = useState(false);
  const [view, setView] = useState("form");
  const reportRef = useRef(null);

  const [form, setForm] = useState({
    empresa: "LIBRERÍA ATLAS",
    grupo: "GRUPO LE KART",
    trimestre: "2DO TRIMESTRE",
    anio: 2024,
    ingresosQ1: 3500000,
    costosQ1: 1800000,
    gastosOperativosQ1: 1000000,
    ingresosQ2: 4200000,
    costosQ2: 1600000,
    gastosOperativosQ2: 500000,
    q2Costo: 350000,
    q2VentasMkt: 320000,
    q2GeneralAdmin: 280000,
    q2Depreciacion: 100000,
    q2Intereses: 50000,
  });

  const set = (field, value) => setForm((p) => ({ ...p, [field]: value }));

  const fmt = (n) => new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", minimumFractionDigits: 0 }).format(Number.isFinite(n) ? n : 0);

  const calc = useMemo(() => {
    const beneficioBrutoQ1 = form.ingresosQ1 - form.costosQ1;
    const beneficioBrutoQ2 = form.ingresosQ2 - form.costosQ2;
    const margenBrutoQ1 = (beneficioBrutoQ1 / Math.max(1, form.ingresosQ1)) * 100;
    const margenBrutoQ2 = (beneficioBrutoQ2 / Math.max(1, form.ingresosQ2)) * 100;
    const beneficioNetoQ1 = form.ingresosQ1 - form.costosQ1 - form.gastosOperativosQ1;
    const beneficioNetoQ2 = form.ingresosQ2 - form.costosQ2 - form.gastosOperativosQ2;
    const margenBeneficioQ1 = (beneficioNetoQ1 / Math.max(1, form.ingresosQ1)) * 100;
    const margenBeneficioQ2 = (beneficioNetoQ2 / Math.max(1, form.ingresosQ2)) * 100;
    const desgloseQ2Sum = (form.q2Costo || 0) + (form.q2VentasMkt || 0) + (form.q2GeneralAdmin || 0) + (form.q2Depreciacion || 0) + (form.q2Intereses || 0);
    const ventasChart = [
      { name: `Q1 ${form.anio}`, Ingresos: form.ingresosQ1, Costos: form.costosQ1 },
      { name: `Q2 ${form.anio}`, Ingresos: form.ingresosQ2, Costos: form.costosQ2 },
    ];
    const pieSobreIngresosQ2 = [
      { name: "Costos", value: Math.max(0, form.costosQ2) },
      { name: "Gastos Operativos", value: Math.max(0, form.gastosOperativosQ2) },
      { name: "Beneficio Neto", value: Math.max(0, beneficioNetoQ2) },
    ];
    return { beneficioBrutoQ1, beneficioBrutoQ2, margenBrutoQ1, margenBrutoQ2, beneficioNetoQ1, beneficioNetoQ2, margenBeneficioQ1, margenBeneficioQ2, desgloseQ2Sum, ventasChart, pieSobreIngresosQ2 };
  }, [form]);

  const checks = useMemo(() => {
    const out = [];
    const esperadoNetoQ2 = form.ingresosQ2 - form.costosQ2 - form.gastosOperativosQ2;
    if (calc.beneficioNetoQ2 !== esperadoNetoQ2) out.push({ type: "error", msg: "Cálculo de beneficio neto Q2 no coincide con los insumos." });
    if (Math.abs(calc.desgloseQ2Sum - form.gastosOperativosQ2) > 1) out.push({ type: "warn", msg: `El desglose de gastos Q2 (${fmt(calc.desgloseQ2Sum)}) no coincide con Gastos Operativos Q2 (${fmt(form.gastosOperativosQ2)}). Puedes escalar el desglose o ajustar Gastos Operativos.` });
    if (calc.margenBeneficioQ2 > 100 || calc.margenBeneficioQ2 < -100) out.push({ type: "warn", msg: `Margen de beneficio Q2 fuera de rango (${calc.margenBeneficioQ2.toFixed(2)}%). Revisa insumos.` });
    return out;
  }, [calc, form]);

  const autoAjustarGastosDesdeDesglose = () => set("gastosOperativosQ2", Math.max(0, calc.desgloseQ2Sum));

  const autoEscalarDesgloseAGastos = () => {
    const suma = calc.desgloseQ2Sum || 1;
    const factor = Math.max(0, form.gastosOperativosQ2) / suma;
    setForm((p) => ({
      ...p,
      q2Costo: Math.round(p.q2Costo * factor),
      q2VentasMkt: Math.round(p.q2VentasMkt * factor),
      q2GeneralAdmin: Math.round(p.q2GeneralAdmin * factor),
      q2Depreciacion: Math.round(p.q2Depreciacion * factor),
      q2Intereses: Math.round(p.q2Intereses * factor),
    }));
  };

  const exportPDF = async () => {
    if (!reportRef.current) return;
    
    // Crear una ventana nueva con el contenido para imprimir
    const printWindow = window.open('', '_blank');
    const reportContent = reportRef.current.cloneNode(true);
    
    // Crear el HTML completo para el PDF
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Informe Financiero ${form.empresa} - ${form.trimestre} ${form.anio}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #1a1a1a;
            background: white;
          }
          .print-container { padding: 20px; }
          .page-break { break-after: page; margin-bottom: 40px; }
          .bg-white { background: white !important; }
          .text-blue-900 { color: #1e3a8a !important; }
          .text-blue-200 { color: #1e3a8a !important; }
          .text-slate-600 { color: #475569 !important; }
          .text-slate-300 { color: #475569 !important; }
          .border-blue-600 { border-color: #2563eb !important; }
          .border-blue-400 { border-color: #2563eb !important; }
          .bg-blue-50\\/50 { background: #eff6ff80 !important; }
          .bg-white\\/5 { background: #f8fafc !important; }
          .dark\\:bg-\\[\\#0b1220\\] { background: white !important; }
          .dark\\:text-gray-100 { color: #1a1a1a !important; }
          .dark\\:border-white\\/10 { border-color: #e2e8f0 !important; }
          .dark\\:text-blue-200 { color: #1e3a8a !important; }
          .dark\\:text-slate-300 { color: #475569 !important; }
          .dark\\:bg-white\\/5 { background: #f8fafc !important; }
          .dark\\:border-blue-400 { border-color: #2563eb !important; }
          .text-green-600, .text-green-700 { color: #059669 !important; }
          .text-red-600 { color: #dc2626 !important; }
          @media print {
            .page-break { break-after: page; }
            body { font-size: 12px; }
          }
        </style>
      </head>
      <body>
        <div class="print-container">
          ${reportContent.innerHTML}
        </div>
      </body>
      </html>
    `;
    
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    
    // Esperar a que se cargue y luego imprimir
    setTimeout(() => {
      printWindow.print();
      setTimeout(() => {
        printWindow.close();
      }, 1000);
    }, 500);
  };

  return (
    <div className={dark ? "dark" : ""}>
      <div className="min-h-screen bg-gray-50 text-gray-900 dark:bg-[#0b1220] dark:text-gray-100">
        <div className="sticky top-0 z-30 bg-white/80 backdrop-blur border-b dark:bg-[#0f172a]/80 dark:border-white/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-xl font-extrabold tracking-wide text-blue-900 dark:text-blue-200 uppercase">Generador de Informe Financiero</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-blue-600/10 text-blue-700 dark:bg-blue-400/10 dark:text-blue-300">Atlas / Le Kart</span>
            </div>
            <div className="flex items-center gap-2">
              <Button variant={view === "form" ? "default" : "secondary"} className={view === "form" ? "bg-blue-600 hover:bg-blue-700" : "bg-gray-200 text-gray-800 hover:bg-gray-300 dark:bg-white/10 dark:text-white dark:hover:bg-white/20"} onClick={() => setView("form")}>
                <Upload className="w-4 h-4 mr-2" /> Formulario
              </Button>
              <Button variant={view === "preview" ? "default" : "secondary"} className={view === "preview" ? "bg-blue-600 hover:bg-blue-700" : "bg-gray-200 text-gray-800 hover:bg-gray-300 dark:bg-white/10 dark:text-white dark:hover:bg-white/20"} onClick={() => setView("preview")}>
                <Eye className="w-4 h-4 mr-2" /> Vista previa
              </Button>
              {view === "preview" && (
                <Button onClick={exportPDF} className="bg-green-600 hover:bg-green-700">
                  <Download className="w-4 h-4 mr-2" /> Exportar PDF
                </Button>
              )}
              <Button variant="ghost" onClick={() => setDark((d) => !d)} className="ml-2" title={dark ? "Modo claro" : "Modo oscuro"}>
                {dark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </Button>
            </div>
          </div>
        </div>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {view === "form" ? (
            <FormView form={form} set={set} calc={calc} checks={checks} autoAjustarGastosDesdeDesglose={autoAjustarGastosDesdeDesglose} autoEscalarDesgloseAGastos={autoEscalarDesgloseAGastos} fmt={fmt} goPreview={() => setView("preview")} />
          ) : (
            <ReportView refEl={reportRef} form={form} calc={calc} fmt={fmt} dark={dark} />
          )}
        </main>
      </div>
    </div>
  );
}

function NumberField({ label, value, onChange, min = 0 }) {
  const handle = (e) => {
    const t = e.target.value;
    const n = t === "" ? 0 : Number(t);
    onChange(Number.isFinite(n) ? n : 0);
  };
  return (
    <div>
      <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">{label}</label>
      <input type="number" inputMode="numeric" min={min} value={value} onChange={handle} className="w-full p-3 rounded-lg border border-gray-300 dark:border-white/10 bg-white dark:bg-white/5 focus:outline-none focus:ring-2 focus:ring-blue-500" />
    </div>
  );
}

function TextField({ label, value, onChange }) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">{label}</label>
      <input type="text" value={value} onChange={(e) => onChange(e.target.value)} className="w-full p-3 rounded-lg border border-gray-300 dark:border-white/10 bg-white dark:bg-white/5 focus:outline-none focus:ring-2 focus:ring-blue-500" />
    </div>
  );
}

function FormView({ form, set, calc, checks, autoAjustarGastosDesdeDesglose, autoEscalarDesgloseAGastos, fmt, goPreview }) {
  return (
    <div className="grid gap-6">
      <div className="text-center">
        <h1 className="text-3xl font-extrabold text-blue-900 dark:text-blue-200">Cargar datos del informe</h1>
        <p className="text-gray-600 dark:text-gray-300">Ingrese los valores tal como los conoce o use los precargados. El sistema valida y sugiere correcciones.</p>
      </div>

      <Card className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10">
        <CardHeader>
          <CardTitle className="text-lg">Información General</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <TextField label="Empresa" value={form.empresa} onChange={(v) => set("empresa", v)} />
          <TextField label="Grupo" value={form.grupo} onChange={(v) => set("grupo", v)} />
          <TextField label="Trimestre" value={form.trimestre} onChange={(v) => set("trimestre", v)} />
          <NumberField label="Año" value={form.anio} onChange={(v) => set("anio", v)} />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10">
          <CardHeader>
            <CardTitle>Q1 {form.anio}</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <NumberField label="Ingresos" value={form.ingresosQ1} onChange={(v) => set("ingresosQ1", v)} />
            <NumberField label="Costos" value={form.costosQ1} onChange={(v) => set("costosQ1", v)} />
            <NumberField label="Gastos Operativos" value={form.gastosOperativosQ1} onChange={(v) => set("gastosOperativosQ1", v)} />
          </CardContent>
        </Card>
        <Card className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10">
          <CardHeader>
            <CardTitle>Q2 {form.anio}</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <NumberField label="Ingresos" value={form.ingresosQ2} onChange={(v) => set("ingresosQ2", v)} />
            <NumberField label="Costos" value={form.costosQ2} onChange={(v) => set("costosQ2", v)} />
            <NumberField label="Gastos Operativos" value={form.gastosOperativosQ2} onChange={(v) => set("gastosOperativosQ2", v)} />
          </CardContent>
        </Card>
      </div>

      <Card className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10">
        <CardHeader>
          <CardTitle>Desglose de Gastos Clave – Q2</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <NumberField label="Costo" value={form.q2Costo} onChange={(v) => set("q2Costo", v)} />
          <NumberField label="Ventas y Marketing" value={form.q2VentasMkt} onChange={(v) => set("q2VentasMkt", v)} />
          <NumberField label="General y Administración" value={form.q2GeneralAdmin} onChange={(v) => set("q2GeneralAdmin", v)} />
          <NumberField label="Depreciación" value={form.q2Depreciacion} onChange={(v) => set("q2Depreciacion", v)} />
          <NumberField label="Intereses" value={form.q2Intereses} onChange={(v) => set("q2Intereses", v)} />
          <div className="md:col-span-5 text-sm text-gray-600 dark:text-gray-300">Suma desglose: <strong>{fmt(calc.desgloseQ2Sum)}</strong></div>
          {checks.length > 0 && (
            <div className="md:col-span-5 space-y-2">
              {checks.map((c, i) => (
                <div key={i} className={`flex items-start gap-2 p-3 rounded-lg ${c.type === "error" ? "bg-red-50 text-red-700 border border-red-200 dark:bg-red-500/10 dark:text-red-200 dark:border-red-500/30" : "bg-yellow-50 text-yellow-800 border border-yellow-200 dark:bg-yellow-500/10 dark:text-yellow-200 dark:border-yellow-500/30"}`}>
                  <AlertCircle className="w-5 h-5 mt-0.5" />
                  <div>{c.msg}</div>
                </div>
              ))}
              <div className="flex flex-wrap gap-3">
                <Button onClick={autoAjustarGastosDesdeDesglose} className="bg-blue-600 hover:bg-blue-700">Usar suma del desglose como Gastos Operativos Q2</Button>
                <Button onClick={autoEscalarDesgloseAGastos} variant="secondary" className="bg-gray-200 text-gray-900 hover:bg-gray-300 dark:bg-white/10 dark:text-white dark:hover:bg-white/20">Escalar desglose para que coincida con Gastos Operativos Q2</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10">
        <CardHeader>
          <CardTitle>Vista rápida</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <KPI label="Beneficio bruto Q2" value={fmt(calc.beneficioBrutoQ2)} />
          <KPI label="Beneficio neto Q2" value={fmt(calc.beneficioNetoQ2)} />
          <KPI label="Margen bruto Q2" value={`${calc.margenBrutoQ2.toFixed(2)}%`} />
        </CardContent>
      </Card>

      <div className="flex justify-center">
        <Button onClick={goPreview} className="bg-blue-600 hover:bg-blue-700">
          <CheckCircle2 className="w-4 h-4 mr-2" /> Listo, ver vista previa con diseño
        </Button>
      </div>
    </div>
  );
}

function KPI({ label, value }) {
  return (
    <div className="p-4 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 dark:from-white/5 dark:to-white/5 dark:border-white/10">
      <div className="text-xs uppercase tracking-wide text-blue-700 dark:text-blue-300 mb-1">{label}</div>
      <div className="text-lg font-bold">{value}</div>
    </div>
  );
}

function ReportView({ refEl, form, calc, fmt, dark }) {
  const brandPrimary = dark ? "text-blue-200" : "text-blue-900";
  const brandAccent = dark ? "text-slate-300" : "text-slate-600";
  const pieData = calc.pieSobreIngresosQ2;
  const pieColors = ["#93c5fd", "#60a5fa", "#1d4ed8"];
  const ventasChartData = calc.ventasChart;
  return (
    <div ref={refEl} className="print:bg-white">
      <Page>
        <div className="border-b-4 border-blue-600 pb-6 mb-8">
          <h1 className={`text-5xl font-black tracking-widest uppercase ${brandPrimary}`}>Informe Financiero</h1>
          <div className={`mt-2 text-xl ${brandAccent}`}>{form.grupo}</div>
          <div className="mt-1 text-2xl font-semibold">{form.empresa}</div>
          <div className="mt-1 text-lg">{form.trimestre} {form.anio}</div>
        </div>
        <div className="grid grid-cols-3 gap-6">
          <IndexItem num="03" label="Resumen Ejecutivo" />
          <IndexItem num="04" label="Aspectos Financieros" />
          <IndexItem num="05" label="Ingresos y Rentabilidad" />
          <IndexItem num="06" label="Desglose de Gastos" />
          <IndexItem num="07" label="Gráfico" />
          <IndexItem num="08" label="Ventas" />
          <IndexItem num="09" label="Datos Inteligentes" />
          <IndexItem num="10" label="Plan General" />
          <IndexItem num="11" label="Ideas de Enfoque" />
          <IndexItem num="12" label="Conclusiones" />
        </div>
      </Page>
      <Page footer="03">
        <SectionTitle title="Resumen Ejecutivo" />
        <p className="text-slate-700 dark:text-slate-300 leading-relaxed mt-4">En el segundo trimestre de {form.anio}, {form.empresa} demostró un sólido desempeño. Este informe resume métricas clave, categorías de gasto y el desempeño de ventas.</p>
      </Page>
      <Page footer="04">
        <SectionTitle title="Aspectos Financieros" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
          <Stat label="Ingresos Alcanzados" value={fmt(form.ingresosQ2)} />
          <Stat label="Aumento de Rentabilidad (Bruta)" value={fmt(calc.beneficioBrutoQ2)} />
          <Stat label="Beneficio Neto" value={fmt(calc.beneficioNetoQ2)} />
          <Stat label="Margen Bruto" value={`${calc.margenBrutoQ2.toFixed(2)}%`} />
        </div>
      </Page>
      <Page footer="05">
        <SectionTitle title="Ingresos y Rentabilidad" />
        <table className="w-full text-sm mt-4">
          <thead className="text-left">
            <tr className="text-slate-500 dark:text-slate-300">
              <th className="py-2">Métrica</th>
              <th className="py-2">Q1 {form.anio}</th>
              <th className="py-2">Q2 {form.anio}</th>
              <th className="py-2">Variación</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-white/10">
            <TR label="Ingresos Totales" a={fmt(form.ingresosQ1)} b={fmt(form.ingresosQ2)} varVal={fmt(form.ingresosQ2 - form.ingresosQ1)} />
            <TR label="Costos de Bienes Vendidos" a={fmt(form.costosQ1)} b={fmt(form.costosQ2)} varVal={fmt(form.costosQ2 - form.costosQ1)} isCost />
            <TR label="Beneficio Bruto" a={fmt(calc.beneficioBrutoQ1)} b={fmt(calc.beneficioBrutoQ2)} varVal={fmt(calc.beneficioBrutoQ2 - calc.beneficioBrutoQ1)} />
            <TR label="Margen Bruto" a={`${calc.margenBrutoQ1.toFixed(2)}%`} b={`${calc.margenBrutoQ2.toFixed(2)}%`} varVal={`${(calc.margenBrutoQ2 - calc.margenBrutoQ1).toFixed(2)}%`} />
            <TR label="Gastos Operativos" a={fmt(form.gastosOperativosQ1)} b={fmt(form.gastosOperativosQ2)} varVal={fmt(form.gastosOperativosQ2 - form.gastosOperativosQ1)} isCost />
            <TR label="Beneficio Neto" a={fmt(calc.beneficioNetoQ1)} b={fmt(calc.beneficioNetoQ2)} varVal={fmt(calc.beneficioNetoQ2 - calc.beneficioNetoQ1)} />
            <TR label="Margen de Beneficio" a={`${calc.margenBeneficioQ1.toFixed(2)}%`} b={`${calc.margenBeneficioQ2.toFixed(2)}%`} varVal={`${(calc.margenBeneficioQ2 - calc.margenBeneficioQ1).toFixed(2)}%`} />
          </tbody>
        </table>
      </Page>
      <Page footer="06">
        <SectionTitle title="Desglose de Gastos Clave" />
        <table className="w-full text-sm mt-4">
          <thead className="text-left">
            <tr className="text-slate-500 dark:text-slate-300">
              <th className="py-2">Categoría</th>
              <th className="py-2">Q2 {form.anio}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-white/10">
            <TRSimple label="Costo" v={fmt(form.q2Costo)} />
            <TRSimple label="Ventas y Marketing" v={fmt(form.q2VentasMkt)} />
            <TRSimple label="General y Administración" v={fmt(form.q2GeneralAdmin)} />
            <TRSimple label="Depreciación" v={fmt(form.q2Depreciacion)} />
            <TRSimple label="Gastos por Intereses" v={fmt(form.q2Intereses)} />
            <tr>
              <td className="py-2 font-semibold">Total desglose</td>
              <td className="py-2 font-semibold">{fmt(calc.desgloseQ2Sum)}</td>
            </tr>
          </tbody>
        </table>
        {Math.abs(calc.desgloseQ2Sum - form.gastosOperativosQ2) > 1 && <p className="mt-3 text-sm text-amber-700 dark:text-amber-300">Nota: El total del desglose no coincide con "Gastos Operativos Q2". Ajuste desde la pantalla de Formulario para evitar inconsistencias.</p>}
      </Page>
      <Page footer="07">
        <SectionTitle title="Gráfico" />
        <div className="mt-4 h-72">
          <ResponsiveContainer width="100%" height="100%">
            <RCPieChart>
              <Pie data={pieData} dataKey="value" nameKey="name" outerRadius={100} innerRadius={40} paddingAngle={2}>
                {pieData.map((_, i) => (
                  <Cell key={i} fill={pieColors[i % pieColors.length]} />
                ))}
              </Pie>
              <Legend />
              <Tooltip formatter={(v) => fmt(v)} />
            </RCPieChart>
          </ResponsiveContainer>
        </div>
        <p className="text-sm text-slate-600 dark:text-slate-300 mt-2">Distribución de ingresos Q2 en Costos, Gastos Operativos y Beneficio Neto.</p>
      </Page>
      <Page footer="08">
        <SectionTitle title="Ventas" />
        <div className="mt-4 h-72">
          <ResponsiveContainer width="100%" height="100%">
            <RCBarChart data={ventasChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip formatter={(v) => fmt(v)} />
              <Legend />
              <Bar dataKey="Ingresos" fill="#3b82f6" />
              <Bar dataKey="Costos" fill="#ef4444" />
            </RCBarChart>
          </ResponsiveContainer>
        </div>
        <p className="text-sm text-slate-600 dark:text-slate-300 mt-2">En el trimestre, los ingresos pasaron de {fmt(form.ingresosQ1)} a {fmt(form.ingresosQ2)}. Los costos disminuyeron y el beneficio neto se incrementó correspondientemente.</p>
      </Page>
      <Page footer="09">
        <SectionTitle title="Datos Inteligentes" />
        <ul className="mt-4 space-y-3">
          <Bullet text={`✅ Aumento de Ingresos Totales: +${fmt(form.ingresosQ2 - form.ingresosQ1)} vs Q1`} />
          <Bullet text={`📉 Variación de Gastos Operativos: ${fmt(form.gastosOperativosQ1)} → ${fmt(form.gastosOperativosQ2)}`} />
          <Bullet text={`💰 Beneficio Neto: ${fmt(calc.beneficioNetoQ1)} → ${fmt(calc.beneficioNetoQ2)}`} />
          <Bullet text={`📊 Margen Bruto: ${calc.margenBrutoQ1.toFixed(2)}% → ${calc.margenBrutoQ2.toFixed(2)}%`} />
        </ul>
      </Page>
      <Page footer="10">
        <SectionTitle title="Plan General" />
        <PlanItem titulo="1. Consolidación de Clientes Nuevos" objetivo="Fidelizar a los nuevos clientes que impulsaron el aumento de ingresos." acciones={["Implementar seguimiento postventa", "Programa de fidelización"]} />
        <PlanItem titulo="2. Optimización de Costos Administrativos" objetivo="Controlar el aumento observado en gastos generales." acciones={["Revisar contratos de proveedores", "Digitalizar procesos administrativos"]} />
        <PlanItem titulo="3. Refuerzo de Marketing Estratégico" objetivo="Mantener impulso de ventas reduciendo gasto publicitario." acciones={["Estrategias digitales de bajo costo", "Campañas en productos de mayor margen"]} />
      </Page>
      <Page footer="11">
        <SectionTitle title="Ideas de Enfoque" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <FocusCard title="Reducción de Costos Operativos" subtitle="Optimizar gastos recurrentes y eficiencia" />
          <FocusCard title="Aumentar Rentabilidad" subtitle="Enfocar mix de productos y pricing" />
        </div>
      </Page>
      <Page footer="12">
        <SectionTitle title="Conclusiones" />
        <p className="text-slate-700 dark:text-slate-300 leading-relaxed mt-4">En el {form.trimestre.toLowerCase()} de {form.anio}, {form.empresa} vendió más, contuvo costos y elevó su beneficio neto. El negocio muestra eficiencia creciente y espacio para consolidar el crecimiento.</p>
      </Page>
    </div>
  );
}

function Page({ children, footer }) {
  return (
    <section className="relative bg-white dark:bg-[#0b1220] text-gray-900 dark:text-gray-100 rounded-xl p-8 shadow-sm border border-gray-200 dark:border-white/10 mb-8 page-break">
      {children}
      {footer && <div className="mt-8 pt-4 text-right text-slate-400 text-xs border-t border-slate-200 dark:border-white/10">INFORME FINANCIERO – {footer}</div>}
    </section>
  );
}

function SectionTitle({ title }) {
  return (
    <div className="border-b-4 border-blue-600 pb-2">
      <h2 className="text-2xl md:text-3xl font-extrabold tracking-wide uppercase text-blue-900 dark:text-blue-200">{title}</h2>
    </div>
  );
}

function IndexItem({ num, label }) {
  return (
    <div className="p-4 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5">
      <div className="text-3xl font-black text-blue-700 dark:text-blue-300">{num}</div>
      <div className="text-sm uppercase tracking-wide text-slate-500 dark:text-slate-300">{label}</div>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="p-4 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5">
      <div className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-300">{label}</div>
      <div className="text-xl font-bold">{value}</div>
    </div>
  );
}

function TR({ label, a, b, varVal, isCost = false }) {
  const isNeg = typeof varVal === "string" ? varVal.trim().startsWith("-") : varVal < 0;
  const tone = isCost ? (isNeg ? "text-green-600" : "text-red-600") : "text-green-700";
  return (
    <tr className="text-sm">
      <td className="py-2">{label}</td>
      <td className="py-2">{a}</td>
      <td className="py-2">{b}</td>
      <td className={`py-2 font-semibold ${tone}`}>{typeof varVal === "number" ? (varVal >= 0 ? "+" : "") + varVal : varVal}</td>
    </tr>
  );
}

function TRSimple({ label, v }) {
  return (
    <tr className="text-sm">
      <td className="py-2">{label}</td>
      <td className="py-2">{v}</td>
    </tr>
  );
}

function Bullet({ text }) {
  return <li className="pl-2 border-l-4 border-blue-600 bg-blue-50/50 dark:bg-white/5 dark:border-blue-400 p-3 rounded">{text}</li>;
}

function PlanItem({ titulo, objetivo, acciones = [] }) {
  return (
    <div className="mt-4 p-4 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5">
      <div className="font-bold mb-1">{titulo}</div>
      <div className="text-sm text-slate-600 dark:text-slate-300 mb-2">Objetivo: {objetivo}</div>
      <ul className="list-disc pl-5 text-sm space-y-1">
        {acciones.map((a, i) => (
          <li key={i}>{a}</li>
        ))}
      </ul>
    </div>
  );
}

function FocusCard({ title, subtitle }) {
  return (
    <div className="p-6 rounded-xl bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-100 dark:from-white/5 dark:to-white/5 dark:border-white/10">
      <div className="text-lg font-bold">{title}</div>
      <div className="text-sm text-slate-600 dark:text-slate-300">{subtitle}</div>
    </div>
  );
}
