import { Stamp } from '../../components/Stamp'
import type { Advice } from '../../domain/advice'

const TONE_LABEL: Record<Advice['tone'], string> = {
  attention: '注意',
  notice: '気づき',
  steady: '目安',
}

export function AdviceList({ advice }: { advice: Advice[] }) {
  return (
    <ul className="advice-list">
      {advice.map((item) => (
        <li key={item.id} className="advice-card" data-tone={item.tone}>
          <div className="advice-head">
            <span className="advice-title">{item.title}</span>
            <Stamp
              tone={
                item.tone === 'attention' ? 'caution' : item.tone === 'steady' ? 'muted' : 'accent'
              }
            >
              {TONE_LABEL[item.tone]}
            </Stamp>
          </div>
          <p className="advice-body">{item.body}</p>
          <p className="advice-evidence">{item.evidence}</p>
        </li>
      ))}
    </ul>
  )
}
