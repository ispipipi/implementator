import { AlertTriangle, ClipboardCheck, Package, Plus, ShoppingCart, Trash2, Warehouse } from 'lucide-react';
import { FormEvent, useMemo, useState } from 'react';
import { usePermisos } from '../../hooks/usePermisos';
import { useAppStore } from '../../store/useAppStore';
import { GlassCard } from '../ui/GlassCard';

const inputClass = 'rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-emerald-300/50';
const buttonClass = 'inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition';

const fmt = new Intl.NumberFormat('es-CL', { maximumFractionDigits: 2 });

export function InventarioView() {
  const {
    bodegasInventario,
    productosInventario,
    movimientosInventario,
    proyectos,
    tareas,
    usuarioActivo,
    crearBodegaInventario,
    crearProductoInventario,
    registrarCompraInventario,
    registrarSolicitudActividadInventario,
    eliminarMovimientoInventario,
  } = useAppStore();
  const { puedeAdministrar, soloLectura } = usePermisos();

  const [bodegaForm, setBodegaForm] = useState({ nombre: '', ubicacion: '', responsable: '' });
  const [productoForm, setProductoForm] = useState({ codigo: '', nombre: '', categoria: '', unidad: 'unidad', stockMinimo: 0 });
  const [compraForm, setCompraForm] = useState({ bodegaId: '', productoId: '', cantidad: 1, proveedor: '', documento: '', notas: '' });
  const [actividadForm, setActividadForm] = useState({ bodegaId: '', productoId: '', cantidad: 1, proyectoId: '', tareaId: '', solicitante: usuarioActivo?.nombre ?? '', notas: '' });

  const bodegasActivas = bodegasInventario.filter((bodega) => bodega.activa);
  const productosActivos = productosInventario.filter((producto) => producto.activo);

  const stockPorClave = useMemo(() => {
    const stock = new Map<string, number>();
    movimientosInventario.forEach((movimiento) => {
      const key = `${movimiento.bodegaId}:${movimiento.productoId}`;
      const actual = stock.get(key) ?? 0;
      stock.set(key, actual + (movimiento.tipo === 'compra' ? movimiento.cantidad : -movimiento.cantidad));
    });
    return stock;
  }, [movimientosInventario]);

  const stockActual = (bodegaId: string, productoId: string) => stockPorClave.get(`${bodegaId}:${productoId}`) ?? 0;

  const filasStock = useMemo(
    () =>
      bodegasActivas.flatMap((bodega) =>
        productosActivos.map((producto) => ({
          bodega,
          producto,
          stock: stockPorClave.get(`${bodega.id}:${producto.id}`) ?? 0,
        })),
      ),
    [bodegasActivas, productosActivos, stockPorClave],
  );

  const stockDisponibleActividad = stockActual(actividadForm.bodegaId, actividadForm.productoId);
  const actividadSinStock = Boolean(actividadForm.bodegaId && actividadForm.productoId && actividadForm.cantidad > stockDisponibleActividad);
  const tareasDelProyecto = actividadForm.proyectoId ? tareas.filter((tarea) => tarea.proyectoId === actividadForm.proyectoId) : tareas;
  const stockTotal = filasStock.reduce((acc, fila) => acc + fila.stock, 0);
  const productosBajoMinimo = filasStock.filter((fila) => fila.stock <= fila.producto.stockMinimo).length;
  const compras = movimientosInventario.filter((movimiento) => movimiento.tipo === 'compra').length;
  const actividades = movimientosInventario.filter((movimiento) => movimiento.tipo === 'actividad').length;

  const crearBodega = (event: FormEvent) => {
    event.preventDefault();
    crearBodegaInventario({ ...bodegaForm, activa: true });
    setBodegaForm({ nombre: '', ubicacion: '', responsable: '' });
  };

  const crearProducto = (event: FormEvent) => {
    event.preventDefault();
    crearProductoInventario({ ...productoForm, activo: true });
    setProductoForm({ codigo: '', nombre: '', categoria: '', unidad: 'unidad', stockMinimo: 0 });
  };

  const registrarCompra = (event: FormEvent) => {
    event.preventDefault();
    registrarCompraInventario(compraForm);
    setCompraForm((s) => ({ ...s, cantidad: 1, proveedor: '', documento: '', notas: '' }));
  };

  const registrarActividad = (event: FormEvent) => {
    event.preventDefault();
    if (actividadSinStock) return;
    registrarSolicitudActividadInventario(actividadForm);
    setActividadForm((s) => ({ ...s, cantidad: 1, tareaId: '', notas: '' }));
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.18em] text-emerald-300">Control operacional</p>
          <h1 className="mt-2 text-3xl font-semibold text-white">Inventario</h1>
          <p className="mt-2 max-w-3xl text-slate-400">
            Controla stock por bodega, registra compras para cargar inventario y solicitudes de actividad para rebajar existencias.
          </p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <GlassCard className="p-4">
          <Warehouse className="h-5 w-5 text-emerald-300" />
          <p className="mt-3 text-2xl font-semibold text-white">{bodegasActivas.length}</p>
          <p className="text-sm text-slate-400">Bodegas activas</p>
        </GlassCard>
        <GlassCard className="p-4">
          <Package className="h-5 w-5 text-blue-200" />
          <p className="mt-3 text-2xl font-semibold text-white">{productosActivos.length}</p>
          <p className="text-sm text-slate-400">Productos controlados</p>
        </GlassCard>
        <GlassCard className="p-4">
          <ShoppingCart className="h-5 w-5 text-emerald-300" />
          <p className="mt-3 text-2xl font-semibold text-white">{compras}</p>
          <p className="text-sm text-slate-400">Compras registradas</p>
        </GlassCard>
        <GlassCard className={`p-4 ${productosBajoMinimo ? 'border-red-400/40 bg-red-500/10' : ''}`}>
          <AlertTriangle className={`h-5 w-5 ${productosBajoMinimo ? 'text-red-300' : 'text-slate-500'}`} />
          <p className="mt-3 text-2xl font-semibold text-white">{productosBajoMinimo}</p>
          <p className="text-sm text-slate-400">Bajo stock minimo</p>
        </GlassCard>
      </div>

      {puedeAdministrar ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <GlassCard className="p-5">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-white">
              <Warehouse className="h-5 w-5 text-emerald-300" />
              Bodegas / almacenes
            </h2>
            <form className="grid gap-3 sm:grid-cols-2" onSubmit={crearBodega}>
              <input className={inputClass} placeholder="Nombre bodega" value={bodegaForm.nombre} onChange={(e) => setBodegaForm((s) => ({ ...s, nombre: e.target.value }))} />
              <input className={inputClass} placeholder="Ubicacion" value={bodegaForm.ubicacion} onChange={(e) => setBodegaForm((s) => ({ ...s, ubicacion: e.target.value }))} />
              <input className={`${inputClass} sm:col-span-2`} placeholder="Responsable" value={bodegaForm.responsable} onChange={(e) => setBodegaForm((s) => ({ ...s, responsable: e.target.value }))} />
              <button className={`${buttonClass} bg-emerald-400 text-slate-950 hover:bg-emerald-300 sm:col-span-2`}>
                <Plus className="h-4 w-4" />
                Crear bodega
              </button>
            </form>
          </GlassCard>

          <GlassCard className="p-5">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-white">
              <Package className="h-5 w-5 text-blue-200" />
              Productos
            </h2>
            <form className="grid gap-3 sm:grid-cols-2" onSubmit={crearProducto}>
              <input className={inputClass} placeholder="Codigo" value={productoForm.codigo} onChange={(e) => setProductoForm((s) => ({ ...s, codigo: e.target.value }))} />
              <input className={inputClass} placeholder="Nombre producto" value={productoForm.nombre} onChange={(e) => setProductoForm((s) => ({ ...s, nombre: e.target.value }))} />
              <input className={inputClass} placeholder="Categoria" value={productoForm.categoria} onChange={(e) => setProductoForm((s) => ({ ...s, categoria: e.target.value }))} />
              <input className={inputClass} placeholder="Unidad" value={productoForm.unidad} onChange={(e) => setProductoForm((s) => ({ ...s, unidad: e.target.value }))} />
              <input type="number" min="0" className={inputClass} placeholder="Stock minimo" value={productoForm.stockMinimo} onChange={(e) => setProductoForm((s) => ({ ...s, stockMinimo: Number(e.target.value) }))} />
              <button className={`${buttonClass} bg-emerald-400 text-slate-950 hover:bg-emerald-300`}>
                <Plus className="h-4 w-4" />
                Crear producto
              </button>
            </form>
          </GlassCard>
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <GlassCard className="p-5">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-white">
            <ShoppingCart className="h-5 w-5 text-emerald-300" />
            Carga por compra
          </h2>
          <form className="grid gap-3 sm:grid-cols-2" onSubmit={registrarCompra}>
            <select className={inputClass} value={compraForm.bodegaId} onChange={(e) => setCompraForm((s) => ({ ...s, bodegaId: e.target.value }))} disabled={soloLectura}>
              <option value="">Bodega</option>
              {bodegasActivas.map((bodega) => <option key={bodega.id} value={bodega.id}>{bodega.nombre}</option>)}
            </select>
            <select className={inputClass} value={compraForm.productoId} onChange={(e) => setCompraForm((s) => ({ ...s, productoId: e.target.value }))} disabled={soloLectura}>
              <option value="">Producto</option>
              {productosActivos.map((producto) => <option key={producto.id} value={producto.id}>{producto.nombre}</option>)}
            </select>
            <input type="number" min="1" className={inputClass} value={compraForm.cantidad} onChange={(e) => setCompraForm((s) => ({ ...s, cantidad: Number(e.target.value) }))} disabled={soloLectura} />
            <input className={inputClass} placeholder="Proveedor" value={compraForm.proveedor} onChange={(e) => setCompraForm((s) => ({ ...s, proveedor: e.target.value }))} disabled={soloLectura} />
            <input className={inputClass} placeholder="Documento / OC" value={compraForm.documento} onChange={(e) => setCompraForm((s) => ({ ...s, documento: e.target.value }))} disabled={soloLectura} />
            <input className={inputClass} placeholder="Notas" value={compraForm.notas} onChange={(e) => setCompraForm((s) => ({ ...s, notas: e.target.value }))} disabled={soloLectura} />
            <button className={`${buttonClass} bg-emerald-400 text-slate-950 hover:bg-emerald-300 sm:col-span-2 disabled:cursor-not-allowed disabled:opacity-50`} disabled={soloLectura || !compraForm.bodegaId || !compraForm.productoId || compraForm.cantidad <= 0}>
              Registrar compra
            </button>
          </form>
        </GlassCard>

        <GlassCard className="p-5">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-white">
            <ClipboardCheck className="h-5 w-5 text-amber-300" />
            Solicitud de actividad
          </h2>
          <form className="grid gap-3 sm:grid-cols-2" onSubmit={registrarActividad}>
            <select className={inputClass} value={actividadForm.proyectoId} onChange={(e) => setActividadForm((s) => ({ ...s, proyectoId: e.target.value, tareaId: '' }))} disabled={soloLectura}>
              <option value="">Proyecto</option>
              {proyectos.map((proyecto) => <option key={proyecto.id} value={proyecto.id}>{proyecto.nombre}</option>)}
            </select>
            <select className={inputClass} value={actividadForm.tareaId} onChange={(e) => setActividadForm((s) => ({ ...s, tareaId: e.target.value }))} disabled={soloLectura}>
              <option value="">Tarea asociada</option>
              {tareasDelProyecto.map((tarea) => <option key={tarea.id} value={tarea.id}>{tarea.nombre}</option>)}
            </select>
            <select className={inputClass} value={actividadForm.bodegaId} onChange={(e) => setActividadForm((s) => ({ ...s, bodegaId: e.target.value }))} disabled={soloLectura}>
              <option value="">Bodega</option>
              {bodegasActivas.map((bodega) => <option key={bodega.id} value={bodega.id}>{bodega.nombre}</option>)}
            </select>
            <select className={inputClass} value={actividadForm.productoId} onChange={(e) => setActividadForm((s) => ({ ...s, productoId: e.target.value }))} disabled={soloLectura}>
              <option value="">Producto</option>
              {productosActivos.map((producto) => <option key={producto.id} value={producto.id}>{producto.nombre}</option>)}
            </select>
            <input type="number" min="1" className={inputClass} value={actividadForm.cantidad} onChange={(e) => setActividadForm((s) => ({ ...s, cantidad: Number(e.target.value) }))} disabled={soloLectura} />
            <input className={inputClass} placeholder="Solicitante" value={actividadForm.solicitante} onChange={(e) => setActividadForm((s) => ({ ...s, solicitante: e.target.value }))} disabled={soloLectura} />
            <input className={`${inputClass} sm:col-span-2`} placeholder="Notas de actividad" value={actividadForm.notas} onChange={(e) => setActividadForm((s) => ({ ...s, notas: e.target.value }))} disabled={soloLectura} />
            {actividadSinStock ? (
              <p className="rounded-lg border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm font-medium text-red-200 sm:col-span-2">
                Stock insuficiente. Disponible: {fmt.format(stockDisponibleActividad)}.
              </p>
            ) : null}
            <button className={`${buttonClass} bg-amber-300 text-slate-950 hover:bg-amber-200 sm:col-span-2 disabled:cursor-not-allowed disabled:opacity-50`} disabled={soloLectura || actividadSinStock || !actividadForm.bodegaId || !actividadForm.productoId || actividadForm.cantidad <= 0}>
              Rebajar por actividad
            </button>
          </form>
        </GlassCard>
      </div>

      <GlassCard className="overflow-hidden">
        <div className="flex flex-col gap-2 border-b border-white/10 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white">Stock por bodega</h2>
            <p className="text-sm text-slate-500">Stock total valorizado en unidades operativas: {fmt.format(stockTotal)}</p>
          </div>
          {productosBajoMinimo ? (
            <span className="inline-flex items-center gap-2 rounded-lg border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm font-semibold text-red-200">
              <AlertTriangle className="h-4 w-4" />
              Revisar reposicion
            </span>
          ) : null}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left">
            <thead className="bg-white/[0.035] text-xs uppercase tracking-[0.14em] text-slate-500">
              <tr>
                <th className="px-4 py-3">Bodega</th>
                <th className="px-4 py-3">Producto</th>
                <th className="px-4 py-3">Categoria</th>
                <th className="px-4 py-3">Stock</th>
                <th className="px-4 py-3">Minimo</th>
                <th className="px-4 py-3">Estado</th>
              </tr>
            </thead>
            <tbody>
              {filasStock.map(({ bodega, producto, stock }) => {
                const bajoMinimo = stock <= producto.stockMinimo;
                return (
                  <tr key={`${bodega.id}-${producto.id}`} className="border-b border-white/8 last:border-0">
                    <td className="px-4 py-3 text-sm font-medium text-white">{bodega.nombre}</td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-white">{producto.nombre}</p>
                      <p className="text-xs text-slate-500">{producto.codigo || 'Sin codigo'} · {producto.unidad}</p>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-400">{producto.categoria || 'General'}</td>
                    <td className={`px-4 py-3 text-lg font-semibold ${bajoMinimo ? 'text-red-300' : 'text-emerald-300'}`}>{fmt.format(stock)}</td>
                    <td className="px-4 py-3 text-sm text-slate-400">{fmt.format(producto.stockMinimo)}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${bajoMinimo ? 'bg-red-500/12 text-red-200 ring-1 ring-red-400/30' : 'bg-emerald-400/12 text-emerald-200 ring-1 ring-emerald-300/20'}`}>
                        {bajoMinimo ? 'Bajo minimo' : 'Disponible'}
                      </span>
                    </td>
                  </tr>
                );
              })}
              {!filasStock.length ? (
                <tr>
                  <td className="px-4 py-10 text-center text-slate-500" colSpan={6}>
                    Crea al menos una bodega y un producto para comenzar el control de inventario.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </GlassCard>

      <GlassCard className="overflow-hidden">
        <div className="border-b border-white/10 p-5">
          <h2 className="text-lg font-semibold text-white">Ultimos movimientos</h2>
          <p className="text-sm text-slate-500">{actividades} rebaja(s) por actividad registradas.</p>
        </div>
        <div className="divide-y divide-white/8">
          {movimientosInventario.slice(0, 12).map((movimiento) => {
            const bodega = bodegasInventario.find((item) => item.id === movimiento.bodegaId);
            const producto = productosInventario.find((item) => item.id === movimiento.productoId);
            const proyecto = proyectos.find((item) => item.id === movimiento.proyectoId);
            return (
              <div key={movimiento.id} className="grid gap-3 px-5 py-4 sm:grid-cols-[1fr_auto] sm:items-center">
                <div>
                  <p className="font-medium text-white">
                    {movimiento.tipo === 'compra' ? 'Compra' : 'Actividad'} · {producto?.nombre ?? 'Producto eliminado'}
                  </p>
                  <p className="mt-1 text-sm text-slate-400">
                    {bodega?.nombre ?? 'Bodega eliminada'} · {fmt.format(movimiento.cantidad)} {producto?.unidad ?? 'unidad'} · {new Date(movimiento.creadoEn).toLocaleString('es-CL')}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {proyecto?.nombre ? `${proyecto.nombre} · ` : ''}{movimiento.proveedor || movimiento.solicitante || movimiento.creadoPor}
                  </p>
                </div>
                {puedeAdministrar ? (
                  <button className="justify-self-start rounded-lg border border-red-400/20 p-2 text-red-300 hover:bg-red-500/10 sm:justify-self-end" onClick={() => eliminarMovimientoInventario(movimiento.id)} aria-label="Eliminar movimiento">
                    <Trash2 className="h-4 w-4" />
                  </button>
                ) : null}
              </div>
            );
          })}
          {!movimientosInventario.length ? (
            <div className="px-5 py-10 text-center text-slate-500">Aun no hay movimientos de inventario.</div>
          ) : null}
        </div>
      </GlassCard>
    </div>
  );
}
