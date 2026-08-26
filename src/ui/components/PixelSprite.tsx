import { spriteCells } from '../../game/monsters'

/** 8×8 像素占位精灵。最终资源由美术替换，禁止 CSS 绘制角色。 */
export function PixelSprite({
  def,
  cell = 12,
  hidden = false,
  animate,
}: {
  def: { a: string; b: string; c: string; d?: string; p: string[] }
  cell?: number
  hidden?: boolean
  animate?: 'shake' | 'flash'
}) {
  const cells = spriteCells(def)
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(8, ${cell}px)`,
        animation:
          animate === 'shake'
            ? 'fq-shake 0.24s steps(2,end)'
            : animate === 'flash'
              ? 'fq-flash 0.3s steps(2,end)'
              : undefined,
      }}
    >
      {cells.map((color, i) => (
        <div
          key={i}
          style={{
            width: cell,
            height: cell,
            background: hidden ? (color === 'transparent' ? 'transparent' : '#2e2a23') : color,
          }}
        />
      ))}
    </div>
  )
}
