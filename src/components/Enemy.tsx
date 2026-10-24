interface EnemyProps {
  x: number;
  hp: number;
  maxHp: number;
  isHit: boolean;
}

export function Enemy({ x, hp, maxHp, isHit }: EnemyProps) {
  if (hp <= 0) return null;

  return (
    <div 
      className={`enemy-box ${isHit ? "hit" : ""}`} 
      style={{ left: `${x}px` }}
    >
      <div className="enemy-mini-hp-bg">
        <div 
          className="enemy-mini-hp-fill" 
          style={{ width: `${(hp / maxHp) * 100}%` }} 
        />
      </div>
      <div className="enemy-eyes">
        <div className="eye"></div>
        <div className="eye"></div>
      </div>
      {/* Groźne ręce wroga */}
      <div className="enemy-hands"></div>
    </div>
  );
}