import React, { useState, useEffect } from "react";
import { createRoot } from "react-dom/client";
import "../styles.css";
import { AdjustmentDialog } from "./AdjustmentDialog";
import {api,downloadCsv,ApiError,type Workspace} from "./api";
import {Login} from "./Login";
import {CreateDialog} from "./CreateDialog";
import {CatalogDialog} from "./CatalogDialog";
import {UserManagement} from "./UserManagement";
import { Dashboard } from './Dashboard';
import {FirstAccess} from "./FirstAccess";
import {filterProducts} from "./domain/catalog";
import { movementLabels, type Product } from "./domain/inventory";
import { Navigation, navigationItems, type View } from './Navigation';
import { PwaTools } from './PwaTools';
import { useVisibleViewport } from './useVisibleViewport';
import { ScanStockDialog } from './ScanStockDialog';
import { ProductPhoto } from './ProductPhoto';

const money = (n: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    n / 100,
  );
function App({state,reload,logout}:{state:Workspace;reload:()=>Promise<void>;logout:()=>Promise<void>}) {
  const [store,setStore]=useState(state.stores[0]?.id??'');
  const [creating,setCreating]=useState<'store'|'product'|null>(null);
  const [view, setView] = useState<View>('inventory');
  const products = state.products.filter((p) => p.storeId === store);
  const [query, setQuery] = useState("");
  const [critical, setCritical] = useState(false);
  const [category,setCategory]=useState('');
  const [editing, setEditing] = useState<Product | null>(null);
  const [catalogEditing,setCatalogEditing]=useState<Product|null>(null);
  const [scanning, setScanning] = useState(false);
  const [message, setMessage] = useState("");
  const filtered=filterProducts(products,{query,criticalOnly:critical,category});
  const historyRows=[
    ...state.history.filter(h=>h.storeId===store).map(h=>({id:h.id,at:h.at,name:h.name,actor:h.actor??'Administrador local',reason:h.reason,detail:`${movementLabels[h.operation]} · Saldo anterior: ${h.before} · Alteração: ${h.delta>0?'+':''}${h.delta} · Saldo final: ${h.after} unidades`})),
    ...state.listingHistory.filter(h=>h.storeId===store).map(h=>{const labels:Record<string,string>={name:'Nome',code:'Código',category:'Categoria',price:'Preço',stock:'Estoque',minimum:'Mínimo',photo:'Foto'};const fields=Object.keys(h.afterValues).filter(key=>JSON.stringify(h.beforeValues[key])!==JSON.stringify(h.afterValues[key]));const show=(key:string,source:Record<string,unknown>)=>source[key]===undefined?'—':key==='price'?money(Number(source[key])):key==='photo'?'Cadastrada':String(source[key]);return {id:h.id,at:h.at,name:String(h.afterValues.name??h.beforeValues.name??'Produto'),actor:h.actor,reason:h.reason,detail:fields.map(key=>`${labels[key]??key}: ${show(key,h.beforeValues)} → ${show(key,h.afterValues)}`).join(' · ')||'Dados do produto atualizados'};}),
  ].sort((a,b)=>Date.parse(b.at)-Date.parse(a.at));
  const exportCsv=async()=>{try{const file=await downloadCsv(store);const url=URL.createObjectURL(file.blob);const link=document.createElement('a');link.href=url;link.download=file.filename;link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);setMessage('CSV da loja exportado.');}catch(error){setMessage(error instanceof Error?error.message:'Não foi possível exportar esta loja.');}};
  return (
    <>
      <a className="skip" href="#main">
        Ir para o conteúdo
      </a>
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-icon">m.</span>minimercado
        </div>
        <div className="nav-label">OPERAÇÃO</div>
        <Navigation role={state.role} view={view} onNavigate={setView}/>
        <div className="sidebar-bottom">
          Desenvolvimento local<p>Dados persistentes. Pagamentos não conectados.</p>
        </div>
      </aside>
      <div className="workspace">
        <header className="topbar">
          <span className="breadcrumb">Operação / {navigationItems.find(item=>item.id===view)?.title}</span>
          <span className="demo-badge">LOCAL</span><button className="secondary" onClick={()=>{void logout().catch(e=>setMessage(e.message));}}>Sair</button>
        </header>
        <main id="main">
          <div className="page-heading">
            <div>
              <p className="eyebrow">TUDO EM SEU LUGAR</p>
              <h1>
                {navigationItems.find(item => item.id === view)?.title}<span>.</span>
              </h1>
              <p className="subtitle">
                {view === 'dashboard' ? 'Acompanhe os resultados da sua rede.' : view === 'users' ? 'Gerencie os acessos da sua rede.' : 'Uma visão clara do que sua loja precisa.'}
              </p>
            </div>
          </div>
          <div className="store-bar" hidden={view === 'dashboard'}>
            <label htmlFor="store">VOCÊ ESTÁ EM</label>
            <select
              id="store"
              value={store}
              onChange={(e) => {
                setStore(e.target.value);
                setMessage("");
              }}
            >
              {state.stores.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div className="action-bar" hidden={view === 'dashboard'}><button className="secondary" onClick={()=>{void reload().then(()=>setMessage("Lista atualizada.")).catch(e=>setMessage(e.message));}}>Atualizar</button>{state.role==='admin'&&<><button className="secondary" onClick={()=>setCreating('store')}>Nova loja</button><button className="primary" disabled={!store} onClick={()=>setCreating('product')}>Novo produto</button></>}</div>
          <div hidden={view!=='inventory'} className="metrics">
            <article>
              <span>Produtos cadastrados</span>
              <strong>{products.length}</strong>
            </article>
            <article>
              <span>Precisam de reposição</span>
              <strong>
                {products.filter((p) => p.stock <= p.minimum).length}
              </strong>
            </article>
            <article>
              <span>Unidades em estoque</span>
              <strong>{products.reduce((sum, p) => sum + p.stock, 0)}</strong>
            </article>
          </div>
          <section hidden={view!=='inventory'} className="catalog" aria-label="Produtos">
            <div className="catalog-toolbar"><button className="primary" disabled={!store} onClick={() => setScanning(true)}>Contar estoque pela câmera</button></div>
            <div className="catalog-toolbar">
              <div className="search-wrap">
                <span aria-hidden="true">⌕</span>
                <input
                  aria-label="Buscar produtos"
                  placeholder="Buscar nome ou código de barras"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>
              <select aria-label="Filtrar categoria" value={category} onChange={e=>setCategory(e.target.value)}><option value="">Todas as categorias</option><option>Bebidas</option><option>Mercearia</option><option>Doces</option><option>Higiene</option></select>
              <button className="secondary" onClick={exportCsv}>Exportar CSV</button>
            </div>
            <div className="filter-row">
              <div className="tabs">
                <button
                  className={"tab " + (!critical ? "selected" : "")}
                  aria-pressed={!critical}
                  onClick={() => setCritical(false)}
                >
                  Todos
                </button>
                <button
                  className={"tab " + (critical ? "selected" : "")}
                  aria-pressed={critical}
                  onClick={() => setCritical(true)}
                >
                  Reposição
                </button>
              </div>
              <span aria-live="polite">{filtered.length} produtos</span>
            </div>
            <div className="list-head">
              <span>PRODUTO</span>
              <span>PREÇO</span>
              <span>ESTOQUE</span>
              <span>SITUAÇÃO</span>
              <span />
            </div>
            {filtered.map((p) => (
              <article className="product-row" key={p.id}>
                <div className="product-detail">
                  <ProductPhoto key={p.photoUrl} url={p.photoUrl} name={p.name}/>
                  <div>
                    <h2 className="product-name">{p.name}</h2>
                    <span className="product-code">{p.code}</span>
                  </div>
                </div>
                <div className="price">{money(p.price)}</div>
                <div className="stock">
                  <strong>{p.stock} un.</strong>
                  <small>Mín. {p.minimum}</small>
                </div>
                <span className={"status "+(p.stock===0?'out':p.stock<=p.minimum?'low':'good')}>
                  {p.stock===0?'Sem estoque':p.stock<=p.minimum?'Repor em breve':'Em dia'}
                </span>
                <div className="product-actions"><button className="edit-button" aria-label={"Ajustar estoque de " + p.name} onClick={() => setEditing({ ...p })}>Estoque</button>{state.role==='admin'&&<button className="edit-button catalog-edit-button" aria-label={'Editar dados de '+p.name} onClick={()=>setCatalogEditing({...p})}>Editar</button>}</div>
              </article>
            ))}
            {!filtered.length && (
              <div className="empty"><h2>Nenhum produto encontrado</h2><p>Tente outro nome, código ou categoria.</p><button className="secondary" onClick={()=>{setQuery('');setCategory('');setCritical(false);}}>Limpar filtros</button></div>
            )}
            <footer className="catalog-footer">
              Dados salvos no servidor local. Recarregar mantém seus ajustes.
            </footer>
          </section>
          <section
            hidden={view!=='history'}
            aria-label="Histórico da loja"
            className="history-list"
          >
            {historyRows.length === 0 && (
              <div className="empty">
                <h2>Nenhum ajuste nesta loja</h2>
                <p>Ao conferir um produto, sua alteração aparecerá aqui.</p>
              </div>
            )}
            {historyRows.map((h) => (
                <article className="history-item" key={h.id}>
                  <h3>{h.name}</h3>
                  <p>
                    {h.detail}
                  </p>
                  <p>{h.reason?.trim() || "Sem observação"}</p><p>Responsável: {h.actor??"Administrador local"}</p>
                  <time dateTime={h.at}>
                    {new Date(h.at).toLocaleString("pt-BR")}
                  </time>
                </article>
              ))}
          </section>
          <section hidden={view!=='stores'} className="stores-list" aria-label="Lojas da rede">{state.stores.map(s=><article className="store-card" key={s.id}><p>LOJA DA REDE</p><h2>{s.name}</h2><p>{s.productCount} produtos · {s.units} unidades em estoque</p><button className="secondary" onClick={()=>{setStore(s.id);setView('inventory');}}>Abrir estoque</button></article>)}</section>
          {state.role==='admin'&&<section hidden={view!=='users'}><UserManagement stores={state.stores}/></section>}
          {state.role === 'admin' && <section hidden={view !== 'dashboard'}><Dashboard stores={state.stores}/></section>}
          <p role="status">{message}</p>
        </main>
      </div>
      {creating&&<CreateDialog kind={creating} storeId={store} onClose={()=>setCreating(null)} onCreated={reload}/>}
      {scanning && <ScanStockDialog key={store} storeId={store} storeName={state.stores.find(s => s.id === store)?.name ?? 'Loja selecionada'} role={state.role} onClose={() => setScanning(false)} onChanged={reload}/>}
      {catalogEditing&&<CatalogDialog product={catalogEditing} storeName={state.stores.find(s=>s.id===catalogEditing.storeId)?.name??'loja selecionada'} onClose={()=>setCatalogEditing(null)} onSave={async input=>{await api('/products/update',input);await reload();setMessage('Produto salvo com histórico no servidor.');}}/>}
      {editing && (
        <AdjustmentDialog
          product={editing}
          onClose={() => setEditing(null)}
          onSave={async (product,operation,quantity,reason,id)=>{
            await api('/adjustments',{id,storeId:product.storeId,productId:product.id,expectedVersion:product.version,operation,quantity,reason});
            await reload();
            setMessage('Ajuste salvo com histórico no servidor.');
          }}
        />
      )}
    </>
  );
}
function Root(){
 useVisibleViewport();
 const [state,setState]=useState<Workspace|null>(null);const [loading,setLoading]=useState(true);const [error,setError]=useState('');const [passwordChangeRequired,setPasswordChangeRequired]=useState(false);
 async function reload(){try{const next=await api<Workspace>('/workspace');setState(next);setError('');setPasswordChangeRequired(false);}catch(e){if(e instanceof ApiError&&e.status===428){setState(null);setError('');setPasswordChangeRequired(true);return;}if(e instanceof ApiError&&e.status===401){setState(null);setError('');setPasswordChangeRequired(false);return;}throw e;}}
 useEffect(()=>{void reload().catch(e=>setError(e.message)).finally(()=>setLoading(false));},[]);
 let content;
 if(loading)content=<main><p role="status">Carregando suas lojas…</p></main>;
 else if(error)content=<main><h1>Não foi possível carregar</h1><p role="alert">{error}</p><button className="primary" onClick={()=>{void reload().catch(e=>setError(e.message));}}>Tentar novamente</button></main>;
 else if(!state&&passwordChangeRequired)content=<FirstAccess onComplete={async()=>{await reload();}}/>;
 else if(!state)content=<Login onLogin={reload}/>;
 else content=<App state={state} reload={reload} logout={async()=>{await api('/auth/sign-out',{});setState(null);}}/>;
 return <><PwaTools authenticated={!!state && !error}/>{content}</>;
}
createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>,
);
