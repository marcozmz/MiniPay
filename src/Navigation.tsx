export const navigationItems = [
  { id: 'dashboard', label: 'Dashboard', title: 'Dashboard', icon: 'M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h7v7h-7z', adminOnly: true },
  { id: 'inventory', label: 'Produtos', title: 'Produtos e estoque', icon: 'M4 7h16v14H4z M3 3h18v4H3z M9 11h6', adminOnly: false },
  { id: 'history', label: 'Histórico', title: 'Histórico', icon: 'M3 11a9 9 0 1 1 2.6 7 M3 4v7h7 M12 7v5l3 2', adminOnly: false },
  { id: 'stores', label: 'Lojas', title: 'Lojas', icon: 'M3 10l2-7h14l2 7 M3 10h18 M5 10v11h14V10 M9 21v-7h6v7', adminOnly: false },
  { id: 'users', label: 'Operadores', title: 'Operadores', icon: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2 M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8 M18 4a4 4 0 0 1 0 7 M22 21v-2a4 4 0 0 0-3-4', adminOnly: true },
] as const;
export type View = typeof navigationItems[number]['id'];
export function Navigation({ role, view, onNavigate }: { role: 'admin' | 'operator'; view: View; onNavigate: (view: View) => void }) {
  return <nav aria-label="Navegação principal">
    {navigationItems.filter(item => !item.adminOnly || role === 'admin').map(item =>
      <button type="button" key={item.id} className={'nav-item' + (view === item.id ? ' active' : '')}
        aria-current={view === item.id ? 'page' : undefined} onClick={() => onNavigate(item.id)}>
        <svg aria-hidden="true" viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d={item.icon}/></svg>
        <span className="nav-text">{item.label}</span>
      </button>)}
  </nav>;
}
