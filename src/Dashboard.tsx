import { useState } from 'react';

type Store = { id: string; name: string };
const summaries = [
  { title: 'Faturamento', description: 'Valor das vendas no período.' },
  { title: 'Ticket médio', description: 'Valor médio por venda.' },
  { title: 'Mix de produtos', description: 'Produtos distintos vendidos no período.' },
];
const analyses = [
  { title: 'Vendas por período', description: 'Evolução do faturamento e da quantidade de vendas.' },
  { title: 'Formas de pagamento', description: 'Quantidade de vendas e valor financeiro por modalidade, apresentados separadamente.' },
  { title: 'Ranking de produtos', description: 'Produtos por faturamento e quantidade vendida.' },
  { title: 'Ranking de lojas', description: 'Resultados das lojas no período selecionado.' },
  { title: 'Ranking de categorias', description: 'Participação das categorias nas vendas.' },
];

export function Dashboard({ stores }: { stores: Store[] }) {
  const [period, setPeriod] = useState('month');
  const [storeId, setStoreId] = useState('');
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const invalidRange = Boolean(start && end && start > end);
  const storeName = stores.find(store => store.id === storeId)?.name ?? 'Todas as lojas';
  const periodName = period === 'today' ? 'Hoje' : period === 'week' ? 'Últimos 7 dias' : period === 'month' ? 'Mês atual' : start && end ? `${start.split('-').reverse().join('/')} a ${end.split('-').reverse().join('/')}` : 'Período personalizado';

  return <div className="dashboard" aria-label="Dashboard de vendas">
    <div className="dashboard-filters" role="group" aria-label="Filtros do dashboard">
      <label>Período<select value={period} onChange={event => setPeriod(event.target.value)}>
        <option value="today">Hoje</option><option value="week">Últimos 7 dias</option><option value="month">Mês atual</option><option value="custom">Personalizado</option>
      </select></label>
      <label>Loja<select value={storeId} onChange={event => setStoreId(event.target.value)}>
        <option value="">Todas as lojas</option>{stores.map(store => <option key={store.id} value={store.id}>{store.name}</option>)}
      </select></label>
      {period === 'custom' && <>
        <label>De<input type="date" value={start} max={end || undefined} onChange={event => setStart(event.target.value)}/></label>
        <label>Até<input type="date" value={end} min={start || undefined} onChange={event => setEnd(event.target.value)}/></label>
      </>}
    </div>
    {period === 'custom' && (invalidRange ? <p role="alert" className="form-error">A data final deve ser igual ou posterior à inicial.</p> : (!start || !end) && <p>Selecione as duas datas para definir o período.</p>)}
    <p className="dashboard-scope" aria-live="polite">{storeName} · {periodName}</p>
    <section className="dashboard-empty" aria-labelledby="sales-empty-title">
      <p className="eyebrow">AGUARDANDO VENDAS</p>
      <h2 id="sales-empty-title">Ainda não há dados de vendas</h2>
      <p>Os indicadores serão preenchidos quando o registro de vendas estiver conectado. Por enquanto, os filtros apenas definem o recorte desejado.</p>
    </section>
    <div className="dashboard-summaries">{summaries.map(item => <article className="dashboard-panel" key={item.title}>
      <h2>{item.title}</h2><p>{item.description}</p><p className="dashboard-unavailable">Aguardando dados de vendas</p>
    </article>)}</div>
    <div className="dashboard-analyses">{analyses.map(item => <section className="dashboard-panel" key={item.title} aria-label={item.title}>
      <h2>{item.title}</h2><p>{item.description}</p><div className="dashboard-placeholder">Sem dados para apresentar.</div>
    </section>)}</div>
    <aside className="dashboard-next" aria-label="Próximos indicadores"><h2>Próximos indicadores</h2>
      <p>Curva ABC, margem e markup. Margem e markup dependem do cadastro de custos e de vendas com custos históricos confiáveis.</p>
    </aside>
  </div>;
}
