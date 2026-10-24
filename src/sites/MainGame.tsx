import { useState, useEffect, useRef } from "react";
import { images } from "../constants/images";
import { Enemy } from "../components/Enemy";
import "./../styles/MainGame.css";

interface EnemyData {
  id: number;
  x: number;
  hp: number;
  maxHp: number;
  direction: number;
  isHit: boolean;
}

const milestones = [500, 1000, 1500, 2000, 2500, 3000, 3500];
const mapWidth = 4900; // Maksymalna szerokość mapy

function MainGame() {
  const [isStarted, setIsStarted] = useState<boolean>(false);
  const [posX, setPosX] = useState<number>(0);
  const [posY, setPosY] = useState<number>(0);
  const [cameraX, setCameraX] = useState<number>(0);
  const [isAttacking, setIsAttacking] = useState<boolean>(false);
  const [facingRight, setFacingRight] = useState<boolean>(true);
  const [playerHp, setPlayerHp] = useState<number>(100);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [isVictory, setIsVictory] = useState<boolean>(false);

  const [enemies, setEnemies] = useState<EnemyData[]>([
    { id: 1, x: 400, hp: 50, maxHp: 50, direction: 1, isHit: false },
    { id: 2, x: 850, hp: 50, maxHp: 50, direction: -1, isHit: false },
    { id: 3, x: 1300, hp: 75, maxHp: 75, direction: 1, isHit: false },
    { id: 4, x: 1900, hp: 100, maxHp: 100, direction: -1, isHit: false },
    { id: 5, x: 2600, hp: 100, maxHp: 100, direction: 1, isHit: false },
  ]);

  const keysPressed = useRef<Record<string, boolean>>({});
  const posXRef = useRef<number>(0);
  const posYRef = useRef<number>(0);
  const velocityYRef = useRef<number>(0);
  const isJumpingRef = useRef<boolean>(false);
  const isAttackingRef = useRef<boolean>(false);

  const enemiesRef = useRef(enemies);
  enemiesRef.current = enemies;

  // Licznik żywych przeciwników
  const aliveEnemiesCount = enemies.filter((e) => e.hp > 0).length;

  useEffect(() => {
    // Sprawdzamy czy wszyscy wrogowie zostali pokonani
    if (isStarted && aliveEnemiesCount === 0 && !isVictory) {
      setIsVictory(true);
    }
  }, [aliveEnemiesCount, isStarted, isVictory]);

  useEffect(() => {
    if (!isStarted || isGameOver || isVictory) return;

    const handleKeyDown = (e: KeyboardEvent): void => {
      if (e.code === "Space") e.preventDefault();
      keysPressed.current[e.key.toLowerCase()] = true;
      keysPressed.current[e.code.toLowerCase()] = true;
    };

    const handleKeyUp = (e: KeyboardEvent): void => {
      keysPressed.current[e.key.toLowerCase()] = false;
      keysPressed.current[e.code.toLowerCase()] = false;
    };

    const handleMouseDown = (e: MouseEvent): void => {
      if (e.button === 0 && !isAttackingRef.current) {
        setIsAttacking(true);
        isAttackingRef.current = true;

        setEnemies((prevEnemies) =>
          prevEnemies.map((enemy) => {
            const distance = Math.abs(posXRef.current - enemy.x);
            if (distance < 350 && posYRef.current < 150) {
              return { 
                ...enemy, 
                hp: Math.max(0, enemy.hp - 25),
                isHit: true 
              };
            }
            return enemy;
          })
        );

        setTimeout(() => {
          setEnemies((prev) => prev.map(en => ({ ...en, isHit: false })));
        }, 150);

        setTimeout(() => {
          setIsAttacking(false);
          isAttackingRef.current = false;
        }, 200);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    window.addEventListener("mousedown", handleMouseDown);

    let animationFrameId: number;
    const speed: number = 6;
    const jumpPower: number = 15;
    const gravity: number = 0.6;

    const gameLoop = (): void => {
      let moved = false;

      // Ruch w prawo z ograniczeniem szerokości mapy (szerokość postaci to ok 150px)
      if (keysPressed.current["d"]) {
        if (posXRef.current < mapWidth - 120) {
          posXRef.current += speed;
          moved = true;
        }
        setFacingRight(true);
      }

      // Ruch w lewo z ograniczeniem do 0
      if (keysPressed.current["a"]) {
        if (posXRef.current > 0) {
          posXRef.current -= speed;
          moved = true;
        }
        setFacingRight(false);
      }

      if (
        (keysPressed.current[" "] || keysPressed.current["space"]) &&
        !isJumpingRef.current
      ) {
        velocityYRef.current = jumpPower;
        isJumpingRef.current = true;
      }

      if (isJumpingRef.current) {
        posYRef.current += velocityYRef.current;
        velocityYRef.current -= gravity;

        if (posYRef.current <= 0) {
          posYRef.current = 0;
          velocityYRef.current = 0;
          isJumpingRef.current = false;
        }
        moved = true;
      }

      // Ruch przeciwników z blokadą, aby nie wychodzili poza granice mapy
      setEnemies((prevEnemies) =>
        prevEnemies.map((enemy) => {
          if (enemy.hp <= 0) return enemy;

          let newX = enemy.x + enemy.direction * 2; 
          let newDir = enemy.direction;

          // Zmiana kierunku przy krańcach patrolu LUB przy wyjściu poza mapę
          if (newX > enemy.x + 100 || newX > mapWidth - 60) newDir = -1;
          if (newX < enemy.x - 100 || newX < 0) newDir = 1;

          return { ...enemy, x: newX, direction: newDir };
        })
      );

      // Obrażenia od przeciwników
      enemiesRef.current.forEach((enemy) => {
        if (enemy.hp > 0) {
          if (Math.abs(posXRef.current - enemy.x) < 45 && posYRef.current < 20) {
            setPlayerHp((prev) => {
              const nextHp = prev - 0.7;
              if (nextHp <= 0) setIsGameOver(true);
              return Math.max(0, nextHp);
            });
          }
        }
      });

      if (moved) {
        setPosX(posXRef.current);
        setPosY(posYRef.current);
        // Kamera płynnie podąża, ale nie pokazuje pustki za mapą
        const targetCameraX = posXRef.current - 200;
        setCameraX(targetCameraX > 0 ? targetCameraX : 0); 
      }

      animationFrameId = requestAnimationFrame(gameLoop);
    };

    animationFrameId = requestAnimationFrame(gameLoop);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      window.removeEventListener("mousedown", handleMouseDown);
      cancelAnimationFrame(animationFrameId);
    };
  }, [isStarted, isGameOver, isVictory]);

  return (
    <>
      {!isStarted && (
        <>
          <div className="back-overlay" />
          <div className="start-game">
            <img src={images.kamilRushLogo} alt="KamilRush Logo" />
            <h1>Zacznij grę!</h1>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsStarted(true);
              }}
            >
              Start
            </button>
          </div>
        </>
      )}

      {isGameOver && (
        <div className="game-over-screen">
          <h1>KONIEC GRY</h1>
          <button onClick={() => window.location.reload()}>Zagraj ponownie</button>
        </div>
      )}

      {isVictory && (
        <div className="game-over-screen victory">
          <h1>WYGRANA! ZWYCIĘSTWO!</h1>
          <p>Pokonałeś wszystkich przeciwników w KamilRush!</p>
          <button onClick={() => window.location.reload()}>Zagraj ponownie</button>
        </div>
      )}

      <div className="main-game-container">
        <div className="hud">
          <div className="health-container">
            <span>Kamil HP:</span>
            <div className="health-bar-bg">
              <div className="health-bar-fill" style={{ width: `${playerHp}%` }} />
            </div>
          </div>
          <div className="health-container">
            <span>Dystans: {Math.floor(posX)} m</span>
          </div>
          {/* --- COUNTER PRZECIWNIKÓW --- */}
          <div className="health-container">
            <span>Wrogowie: {aliveEnemiesCount} / {enemies.length}</span>
          </div>
        </div>

        <div className="game-world" style={{ transform: `translateX(-${cameraX}px)` }}>
          <div className="ground" />

          {milestones.map((m) => (
            <div key={m} className="milestone-pillar" style={{ left: `${m}px` }}>
              <span>{m}m</span>
            </div>
          ))}

          {enemies.map((enemy) => (
            <Enemy
              key={enemy.id}
              x={enemy.x}
              hp={enemy.hp}
              maxHp={enemy.maxHp}
              isHit={enemy.isHit}
            />
          ))}

          <div
            className="kamil-box"
            style={{
              left: `${posX}px`,
              bottom: `${180 + posY}px`,
              transform: facingRight ? "scaleX(1)" : "scaleX(-1)",
              transformOrigin: "center",
            }}
          >
            <img className="kamil" src={images.kamil} id="kamil" alt="kamil" />
            <img
              className={`katana ${isAttacking ? "attack" : ""}`}
              src={images.katana}
              alt="katana"
            />
          </div>
        </div>
      </div>
    </>
  );
}

export default MainGame;