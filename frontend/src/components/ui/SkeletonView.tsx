import React from 'react';
import { Skeleton } from './Skeleton';

type Tab = 'empresas' | 'agents' | 'follow-ups' | 'leads' | 'messages' | 'users';

interface SkeletonViewProps {
  tab: Tab;
}

export const SkeletonView: React.FC<SkeletonViewProps> = ({ tab }) => {
  if (tab === 'users') {
    return (
      <div className="table-container" style={{ pointerEvents: 'none' }}>
        <table className="custom-table">
          <thead>
            <tr>
              <th>Nome</th>
              <th>E-mail</th>
              <th>Função (Role)</th>
              <th>Empresa Vinculada</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {[1, 2, 3].map((i) => (
              <tr key={i}>
                <td><Skeleton type="text" style={{ width: '120px', height: '14px', margin: 0 }} /></td>
                <td><Skeleton type="text" style={{ width: '160px', height: '14px', margin: 0 }} /></td>
                <td><Skeleton type="text" style={{ width: '80px', height: '14px', margin: 0 }} /></td>
                <td><Skeleton type="text" style={{ width: '100px', height: '14px', margin: 0 }} /></td>
                <td>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <Skeleton style={{ width: '60px', height: '24px', borderRadius: '8px' }} />
                    <Skeleton style={{ width: '75px', height: '24px', borderRadius: '8px' }} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (tab === 'empresas') {
    return (
      <div className="dashboard-grid">
        {[1, 2, 3].map((i) => (
          <div key={i} className="card" style={{ pointerEvents: 'none' }}>
            <div className="card-header">
              <Skeleton type="circle" />
              <Skeleton style={{ width: '60px', height: '20px', borderRadius: '9999px' }} />
            </div>
            <div className="card-body">
              <Skeleton type="title" style={{ width: '70%', height: '20px' }} />
              <Skeleton type="text" style={{ width: '45%', height: '12px' }} />
            </div>
            <div className="card-footer">
              <Skeleton style={{ width: '70px', height: '28px', borderRadius: '8px' }} />
              <Skeleton style={{ width: '80px', height: '28px', borderRadius: '8px' }} />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (tab === 'agents') {
    return (
      <div className="dashboard-grid">
        {[1, 2, 3].map((i) => (
          <div key={i} className="card" style={{ pointerEvents: 'none' }}>
            <div className="card-header">
              <Skeleton style={{ width: '90px', height: '20px', borderRadius: '9999px' }} />
              <Skeleton style={{ width: '50px', height: '20px', borderRadius: '9999px' }} />
            </div>
            <div className="card-body">
              <Skeleton type="title" style={{ width: '60%', height: '22px' }} />
              <Skeleton type="text" style={{ width: '80%', height: '14px' }} />
              <Skeleton type="text" style={{ width: '70%', height: '14px' }} />
              <Skeleton type="text" style={{ width: '90%', height: '14px' }} />
            </div>
            <div className="card-footer">
              <Skeleton style={{ width: '70px', height: '28px', borderRadius: '8px' }} />
              <Skeleton style={{ width: '80px', height: '28px', borderRadius: '8px' }} />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (tab === 'follow-ups') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', pointerEvents: 'none' }}>
        {[1, 2].map((groupIndex) => (
          <div key={groupIndex} style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--card-border))', borderRadius: 'var(--radius)', padding: '24px' }}>
            <div style={{ borderBottom: '2px solid hsl(var(--card-border))', paddingBottom: '10px', marginBottom: '16px' }}>
              <Skeleton type="title" style={{ width: '200px', height: '20px', margin: 0 }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div style={{ marginLeft: '12px' }}>
                <div style={{ marginBottom: '12px' }}>
                  <Skeleton type="text" style={{ width: '120px', height: '16px' }} />
                </div>
                <div className="dashboard-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
                  {[1, 2].map((i) => (
                    <div key={i} className="card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', minHeight: '180px' }}>
                      <div className="card-header" style={{ marginBottom: '12px' }}>
                        <Skeleton style={{ width: '60px', height: '20px', borderRadius: '9999px' }} />
                        <Skeleton style={{ width: '50px', height: '20px', borderRadius: '9999px' }} />
                      </div>
                      <div className="card-body" style={{ flex: 1, padding: 0, gap: '8px' }}>
                        <Skeleton type="text" style={{ width: '40%', height: '14px' }} />
                        <Skeleton type="text" style={{ width: '100%', height: '40px' }} />
                      </div>
                      <div className="card-footer" style={{ marginTop: '16px', paddingBottom: 0 }}>
                        <Skeleton style={{ width: '60px', height: '24px', borderRadius: '8px' }} />
                        <Skeleton style={{ width: '70px', height: '24px', borderRadius: '8px' }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (tab === 'leads') {
    return (
      <div className="table-container" style={{ pointerEvents: 'none' }}>
        <table className="custom-table">
          <thead>
            <tr>
              <th>Nome</th>
              <th>Telefone / JID</th>
              <th>Agente Vinculado</th>
              <th>Estado (Status)</th>
              <th>Valor</th>
              <th>Última Mensagem</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {[1, 2, 3, 4, 5].map((i) => (
              <tr key={i}>
                <td><Skeleton type="text" style={{ width: '120px', height: '14px', margin: 0 }} /></td>
                <td><Skeleton type="text" style={{ width: '140px', height: '14px', margin: 0 }} /></td>
                <td><Skeleton type="text" style={{ width: '100px', height: '14px', margin: 0 }} /></td>
                <td><Skeleton style={{ width: '70px', height: '20px', borderRadius: '9999px' }} /></td>
                <td><Skeleton type="text" style={{ width: '60px', height: '14px', margin: 0 }} /></td>
                <td><Skeleton type="text" style={{ width: '130px', height: '14px', margin: 0 }} /></td>
                <td>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <Skeleton style={{ width: '60px', height: '24px', borderRadius: '8px' }} />
                    <Skeleton style={{ width: '75px', height: '24px', borderRadius: '8px' }} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (tab === 'messages') {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '32px', pointerEvents: 'none' }}>
        <div style={{
          background: 'hsl(var(--card))',
          border: '1px solid hsl(var(--card-border))',
          borderRadius: 'var(--radius)',
          padding: '20px',
          height: 'fit-content'
        }}>
          <Skeleton type="title" style={{ width: '60%', height: '20px' }} />
          {[1, 2, 3].map((i) => (
            <div key={i} style={{ marginTop: '16px' }}>
              <Skeleton type="text" style={{ width: '40%', height: '14px' }} />
              <Skeleton type="text" style={{ width: '50%', height: '12px', marginLeft: '8px', marginTop: '6px' }} />
              <Skeleton type="text" style={{ width: '80%', height: '28px', marginLeft: '12px', marginTop: '6px', borderRadius: '8px' }} />
            </div>
          ))}
        </div>
        <div className="chat-container">
          <div className="chat-header">
            <Skeleton type="title" style={{ width: '150px', height: '20px', margin: 0 }} />
          </div>
          <div className="chat-messages" style={{ gap: '16px' }}>
            {[1, 2, 3].map((i) => (
              <div key={i} style={{
                alignSelf: i % 2 === 0 ? 'flex-end' : 'flex-start',
                width: '60%'
              }}>
                <Skeleton style={{
                  height: '60px',
                  borderRadius: '16px',
                  borderBottomRightRadius: i % 2 === 0 ? '4px' : '16px',
                  borderBottomLeftRadius: i % 2 !== 0 ? '4px' : '16px'
                }} />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return null;
};
