import React, { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Generates floating hearts in the background.
 */
function FloatingHearts() {
  const [hearts, setHearts] = useState<{ id: number; left: number; duration: number; scale: number }[]>([]);

  useEffect(() => {
    let heartId = 0;
    const interval = setInterval(() => {
      setHearts((prev) => {
        // keep only the last 20 to prevent memory leaks
        const newHearts = [...prev.slice(-19), {
          id: heartId++,
          left: Math.random() * 100,
          duration: Math.random() * 7 + 8,
          scale: Math.random() * 0.5 + 0.8
        }];
        return newHearts;
      });
    }, 400);

    return () => clearInterval(interval);
  }, []);

  return (
    <div id="heart-container">
      {hearts.map((heart) => (
        <div
          key={heart.id}
          className="floating-heart"
          style={{
            left: `${heart.left}vw`,
            animationDuration: `${heart.duration}s`,
            transform: `scale(${heart.scale})`,
          }}
        >
          ❤️
        </div>
      ))}
    </div>
  );
}

/**
 * Renders a burst of hearts where the user clicked.
 */
function BurstHearts({ x, y, onComplete }: { x: number; y: number; onComplete: () => void }) {
  const [particles, setParticles] = useState<{ id: number; emoji: string; tx: number; ty: number }[]>([]);

  useEffect(() => {
    const emojis = ['❤️', '💖', '✨', '🎉'];
    const newParticles = [];
    for (let i = 0; i < 15; i++) {
      newParticles.push({
        id: i,
        emoji: emojis[Math.floor(Math.random() * emojis.length)],
        tx: (Math.random() - 0.5) * 300,
        ty: (Math.random() - 0.5) * 300,
      });
    }
    setParticles(newParticles);

    const timer = setTimeout(() => {
      onComplete();
    }, 1000);

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <>
      {particles.map((p) => (
        <div
          key={p.id}
          className="burst-heart"
          style={{
            left: `${x}px`,
            top: `${y - 20}px`,
            '--tx': `${p.tx}px`,
            '--ty': `${p.ty}px`
          } as React.CSSProperties}
        >
          {p.emoji}
        </div>
      ))}
    </>
  );
}

export default function App() {
  const [phase, setPhase] = useState<'countdown' | 'gift' | 'cake' | 'magical_transition' | 'main' | 'final'>('countdown');
  const [count, setCount] = useState(5);
  const [countShow, setCountShow] = useState(false);
  const [burstCoords, setBurstCoords] = useState<{ x: number; y: number } | null>(null);
  const [isFadingOut, setIsFadingOut] = useState(false);

  // Cake Cutting State
  const [cakeState, setCakeState] = useState<'initial' | 'cutting' | 'cut_complete'>('initial');
  const [cuts, setCuts] = useState(0);
  const [cakeRotation, setCakeRotation] = useState(0);

  // Serving Scene State
  const [servingMode, setServingMode] = useState(false);
  const [currentPieceIndex, setCurrentPieceIndex] = useState(0);
  const [isNoteVisible, setIsNoteVisible] = useState(false);
  const [isTransitioningNote, setIsTransitioningNote] = useState(false);

  // Final Scene State
  const [currentFontIndex, setCurrentFontIndex] = useState(0);
  const finalScreenFonts = [
    "var(--font-romantic)",
    "var(--font-modern)",
    "'Comic Sans MS', cursive, sans-serif",
    "'Brush Script MT', cursive",
    "'Courier New', Courier, monospace",
    "'Impact', Charcoal, sans-serif",
    "'Trebuchet MS', Helvetica, sans-serif",
    "'Arial Black', Gadget, sans-serif",
    "'Lucida Handwriting', cursive",
    "'Times New Roman', Times, serif"
  ];

  const LOVE_NOTES = [
    { title: "B'day Special 🎂", text: "Today is not just your birthday, it is the day my favorite person came into this world.\n\nI hope this day reminds you how special, loved, and precious you are.\n\nHappy Birthday, my love ❤️" },
    { title: "Confession 💌", text: "I may not always say everything perfectly, but my heart knows one truth clearly.\n\nYou mean more to me than words can explain, and having you in my life feels like a blessing." },
    { title: "Love ❤️", text: "You are my comfort, my happiness, and my favorite feeling.\n\nEvery little moment with you becomes something beautiful because it has you in it." },
    { title: "Promises 🤍", text: "I promise to stand by you, care for you, support you, and love you through every season.\n\nNo matter what life brings, my heart will always choose you." }
  ];

  // Audio refs and states
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const hasStartedMusicRef = useRef(false);
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);

  useEffect(() => {
    if (phase === 'countdown') {
      if (count < 0) {
        setPhase('gift');
        return;
      }
      
      // Trigger animation
      setCountShow(false);
      const showTimer = setTimeout(() => setCountShow(true), 50);
      
      const hideTimer = setTimeout(() => {
        setCountShow(false);
        const nextTimer = setTimeout(() => setCount(c => c - 1), 300);
        return () => clearTimeout(nextTimer);
      }, 700);

      return () => {
        clearTimeout(showTimer);
        clearTimeout(hideTimer);
      };
    }

    if (phase === 'final') {
      const interval = setInterval(() => {
        setCurrentFontIndex(prev => (prev + 1) % finalScreenFonts.length);
      }, 750);
      return () => clearInterval(interval);
    }
  }, [count, phase]);

  const handleGiftClick = (e: React.MouseEvent | React.TouchEvent) => {
    if ('clientX' in e) {
      setBurstCoords({ x: e.clientX, y: e.clientY });
    } else if ('touches' in e && e.touches.length > 0) {
      setBurstCoords({ x: e.touches[0].clientX, y: e.touches[0].clientY });
    } else {
      setBurstCoords({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
    }
    
    // Play music directly in user interaction handler
    if (!hasStartedMusicRef.current && audioRef.current) {
      hasStartedMusicRef.current = true;
      audioRef.current.volume = 0.35;
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch((err) => {
        console.log('Failed to play music:', err);
        hasStartedMusicRef.current = false;
      });
    }

    // Move to cake phase after short delay for burst
    setTimeout(() => {
      setPhase('cake');
    }, 500);
  };

  const toggleMusic = () => {
    if (audioRef.current) {
      if (audioRef.current.paused) {
        audioRef.current.volume = 0.35;
        audioRef.current.play().catch(err => {
          console.log('Failed to play music manually:', err);
        });
      } else {
        audioRef.current.pause();
      }
    }
  };

  const handleCakeClick = (e: React.MouseEvent) => {
    if (cakeState !== 'cutting') return;
    if (cuts >= 2) return;
    
    const nextCuts = cuts + 1;
    setCuts(nextCuts);
    
    // Rotate cake
    let nextRotation = 0;
    if (nextCuts === 1) nextRotation = 180;
    if (nextCuts === 2) nextRotation = 360;
    
    setCakeRotation(nextRotation);
    
    // If finished cutting
    if (nextCuts === 2) {
      const target = e.currentTarget as HTMLElement;
      // Trigger celebrate slightly after last slash
      setTimeout(() => {
        setCakeState('cut_complete');
        if (target) {
          const rect = target.getBoundingClientRect();
          setBurstCoords({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 });
        }
        // Transition to serving mode
        setTimeout(() => {
          setServingMode(true);
        }, 1800);
      }, 600); // 600ms matches the rotation animation
    }
  };

  const handleContinue = () => {
    setIsFadingOut(true);
    setTimeout(() => {
      setPhase('magical_transition');
      setIsFadingOut(false);
      
      setTimeout(() => {
        setIsFadingOut(true);
        setTimeout(() => {
          setPhase('main');
          document.body.style.overflow = 'auto';
        }, 1500);
      }, 4000);
    }, 1500); // Wait for fade out
  };

  if (phase === 'magical_transition') {
    return (
      <div 
        className="fixed inset-0 z-50 flex items-center justify-center p-4 transition-opacity duration-1000 overflow-hidden"
        style={{ 
          backgroundColor: '#0a0204', 
          opacity: isFadingOut ? 0 : 1 
        }}
      >
        <FloatingHearts />
        
        {/* Magical Sparkles */}
        <div className="absolute inset-0 pointer-events-none">
          {Array.from({ length: 30 }).map((_, i) => (
             <div 
               key={`sparkle-${i}`} 
               className="cake-sparkle absolute" 
               style={{ 
                 top: `${Math.random() * 100}%`, 
                 left: `${Math.random() * 100}%`, 
                 animationDelay: `${Math.random() * 2}s`,
                 transform: `scale(${Math.random() * 0.5 + 0.5})`
               }}
             ></div>
          ))}
        </div>

        <h2 
          className="fade-in-up text-3xl md:text-5xl font-romantic text-white text-center italic tracking-wide leading-relaxed z-10" 
          style={{ 
            textShadow: "0 4px 20px rgba(244, 114, 182, 0.8)",
            animationDelay: '0.5s'
          }}
        >
          "Now step into a little world<br/>made just for you..."
        </h2>
      </div>
    );
  }

  if (phase === 'main') {
    return (
      <div id="mainWebsite" className="h-screen w-full font-modern text-rose-900 bg-rose-50 overflow-hidden flex flex-col">
        {/* Main Hero Birthday Message Section */}
        <section className="flex-1 flex flex-col justify-center items-center relative px-4 overflow-hidden birthday-hero">
          {/* Subtle background effects */}
          <FloatingHearts />
          <div className="absolute inset-0 pointer-events-none">
            {Array.from({ length: 20 }).map((_, i) => (
               <div 
                 key={`hero-sparkle-${i}`} 
                 className="cake-sparkle absolute" 
                 style={{ 
                   top: `${Math.random() * 100}%`, 
                   left: `${Math.random() * 100}%`, 
                   animationDelay: `${Math.random() * 3}s`,
                   transform: `scale(${Math.random() * 0.5 + 0.5})`,
                   opacity: 0.3
                 }}
               ></div>
            ))}
          </div>

          <div className="z-10 flex flex-col items-center text-center max-w-4xl mx-auto w-full">
            <h1 className="hero-title font-romantic text-5xl md:text-6xl lg:text-7xl text-rose-800 mb-8 md:mb-12 drop-shadow-sm">
              Happy Birthday, My Love ❤️
            </h1>

            <div className="hero-quote relative bg-white bg-opacity-80 backdrop-blur-md p-8 md:p-14 rounded-3xl border border-pink-200 mx-4 mb-8 w-full max-w-3xl">
              {/* Decorative elements for the quote */}
              <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-4xl animate-bounce" style={{ filter: 'drop-shadow(0 2px 4px rgba(244,114,182,0.4))' }}>✨</div>
              <p className="font-modern text-xl md:text-3xl text-rose-900 leading-relaxed font-semibold italic">
                "It’s not just your birthday,<br className="hidden md:block" />
                it’s my good luck that you were born this day."
              </p>
              <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-4xl animate-bounce" style={{ animationDelay: '0.5s', filter: 'drop-shadow(0 2px 4px rgba(244,114,182,0.4))' }}>✨</div>
            </div>

            <div className="hero-button">
              <button 
                className="continue-btn px-8 py-4 text-xl md:text-2xl shadow-xl hover:scale-105 transition-transform"
                onClick={() => {
                  setIsFadingOut(true);
                  setTimeout(() => {
                    setPhase('final');
                    setIsFadingOut(false);
                  }, 1000);
                }}
              >
                Move to the final Screen ✨
              </button>
            </div>
          </div>
        </section>
      </div>
    );
  }

  if (phase === 'final') {
    return (
      <div 
        className="fixed inset-0 z-50 flex flex-col items-center justify-center p-4 transition-opacity duration-1000 overflow-hidden"
        style={{ 
          backgroundColor: '#0a0204', 
          opacity: isFadingOut ? 0 : 1 
        }}
      >
        <FloatingHearts />
        
        {/* Magical Sparkles */}
        <div className="absolute inset-0 pointer-events-none">
          {Array.from({ length: 40 }).map((_, i) => (
             <div 
               key={`sparkle-${i}`} 
               className="cake-sparkle absolute" 
               style={{ 
                 top: `${Math.random() * 100}%`, 
                 left: `${Math.random() * 100}%`, 
                 animationDelay: `${Math.random() * 2}s`,
                 transform: `scale(${Math.random() * 0.5 + 0.5})`
               }}
             ></div>
          ))}
        </div>

        <div className="relative h-40 flex items-center justify-center w-full max-w-4xl">
          {finalScreenFonts.map((font, index) => (
            <h2 
              key={index}
              className="absolute w-full text-4xl md:text-6xl text-center px-4 transition-all z-10" 
              style={{ 
                fontFamily: font,
                color: '#f472b6',
                textShadow: "0 0 20px rgba(244, 114, 182, 0.6), 0 0 40px rgba(244, 114, 182, 0.4)",
                opacity: currentFontIndex === index ? 1 : 0,
                transform: currentFontIndex === index ? 'scale(1) translateY(0)' : 'scale(0.95) translateY(10px)',
                filter: currentFontIndex === index ? 'blur(0px)' : 'blur(4px)',
                transitionDuration: '700ms',
                transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)'
              }}
            >
              Happy Birthday JAANAA ❤️
            </h2>
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Hidden audio element for birthday music */}
      <audio 
        ref={audioRef} 
        src="/music/birthday-song.mp3" 
        loop 
        preload="auto" 
        playsInline 
        onPlay={() => setIsMusicPlaying(true)}
        onPause={() => setIsMusicPlaying(false)}
      />

      {/* Floating Audio Control Button */}
      {phase !== 'countdown' && (
        <button 
          className="floating-music-btn"
          onClick={toggleMusic}
          aria-label={isMusicPlaying ? "Pause music" : "Play music"}
        >
          {isMusicPlaying ? '🔊' : '🔇'}
        </button>
      )}

      <div id="welcome-screen" style={{ opacity: isFadingOut ? 0 : 1 }}>
        <FloatingHearts />
        
        <div className="background-image"></div>
        <div className="overlay"></div>

        <div className="content">
          {phase === 'countdown' && (
            <div className={`countdown-timer ${countShow ? 'show' : ''}`}>
              {count}
            </div>
          )}

          {phase === 'gift' && (
            <div className="pop-in" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div 
                className="gift-box" 
                onClick={handleGiftClick}
                onTouchStart={handleGiftClick}
              >🎁</div>
              <div className="fade-in-text">
                <p className="sub-text">Your birthday magic begins here...</p>
                <p className="main-text">Tap the gift and let the surprise unfold 🎁</p>
              </div>
            </div>
          )}

          {phase === 'cake' && (
            <div className="pop-in" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', padding: '0 20px' }}>
              
              {!servingMode ? (
                <>
                  <div className="cake-wrapper relative">
                    {/* Cut Progress Counter */}
                    {(cakeState === 'cutting' || cakeState === 'cut_complete') && (
                      <div className="cut-counter fade-in-text">
                        {cuts}/2 cuts
                      </div>
                    )}

                <div className="cake-3d-scene pop-in-3d relative">
                  {/* Ambient Glow behind the cake */}
                  <div className="cake-ambient-glow"></div>

                  {/* Surrounding sparkles */}
                  <div className="cake-sparkle" style={{ top: '20%', left: '10%', animationDelay: '0s' }}></div>
                  <div className="cake-sparkle" style={{ top: '10%', left: '80%', animationDelay: '0.4s' }}></div>
                  <div className="cake-sparkle" style={{ top: '60%', left: '85%', animationDelay: '0.8s' }}></div>
                  <div className="cake-sparkle" style={{ top: '70%', left: '15%', animationDelay: '1.2s' }}></div>
                  <div className="cake-sparkle" style={{ top: '30%', left: '90%', animationDelay: '0.6s' }}></div>
                  <div className="cake-sparkle" style={{ top: '-10%', left: '50%', animationDelay: '0.2s' }}></div>

                  <div 
                    className={`cake-3d-rotator flex items-center justify-center ${cakeState === 'cutting' ? 'cursor-crosshair' : ''}`}
                    style={{ transform: `rotateX(-15deg) rotateY(${cakeRotation}deg)`, transition: 'transform 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)' }}
                    onClick={handleCakeClick}
                  >
                    {/* Cake Base Plate */}
                    <div className="cake-plate-3d"></div>

                    {/* Cake Sides (Body) */}
                    {Array.from({ length: 36 }).map((_, i) => (
                      <div
                        key={`side-${i}`}
                        className="cake-side-3d"
                        style={{
                          transform: `rotateY(${i * 10}deg) translateZ(115.5px)`
                        }}
                      >
                        <div 
                          className="frosting-drip-3d" 
                          style={{ 
                            height: `${28 + (Math.sin(i * 2) * 12)}px`, 
                          }}
                        ></div>
                      </div>
                    ))}

                    {/* Cake Top */}
                    <div className="cake-top-3d">
                      <div className="cake-top-base-3d"></div>

                      {/* Edge decorations (piped cream with pearls) */}
                      {Array.from({ length: 12 }).map((_, i) => (
                        <div 
                          key={`deco-${i}`} 
                          className="cake-deco-3d"
                          style={{
                            transform: `rotate(${i * 30}deg) translateY(-106px) translateZ(10px)`
                          }}
                        >
                          <div className="deco-pearl"></div>
                          {i % 3 === 0 && (
                            <div 
                              className="deco-heart"
                              style={{ transform: `rotate(${-i * 30}deg) translateZ(12px) rotateX(-90deg) translateY(-8px)` }}
                            >
                              ❤️
                            </div>
                          )}
                        </div>
                      ))}

                      {/* Candle */}
                      <div className="cake-candle-3d">
                        <div className="candle-body">
                          <div className="c-face front"></div>
                          <div className="c-face back"></div>
                          <div className="c-face left"></div>
                          <div className="c-face right"></div>
                          <div className="c-face top"></div>
                        </div>
                        <div className="candle-flame-container-3d">
                          <div className="flame-plane"></div>
                          <div className="flame-plane" style={{ transform: 'rotateY(90deg)' }}></div>
                          <div className="flame-aura"></div>
                        </div>
                      </div>

                      {/* Cut Lines placed on top surface */}
                      {cuts >= 1 && <div className="cut-line-3d vertical-cut-3d"></div>}
                      {cuts >= 2 && <div className="cut-line-3d horizontal-cut-3d"></div>}
                    </div>

                    {/* Cake Bottom */}
                    <div className="cake-bottom-3d"></div>
                  </div>
                </div>

                {/* Floating Knife */}
                {cakeState === 'cutting' && (
                  <div className="floating-knife fade-in-text">🔪</div>
                )}
              </div>

              {cakeState === 'initial' && (
                <>
                  <div className="fade-in-text mt-4">
                    <p className="sub-text">Make a wish, birthday boy ❤️</p>
                  </div>
                  <button className="continue-btn fade-in-text" onClick={() => setCakeState('cutting')}>
                    Cut the Cake 🔪
                  </button>
                </>
              )}

              {cakeState === 'cutting' && (
                <div className="fade-in-text mt-4">
                  <p className="sub-text font-bold text-lg" style={{ color: 'var(--primary-pink)' }}>Tap the cake to make a cut 🔪</p>
                </div>
              )}

              {cakeState === 'cut_complete' && (
                <div className="fade-in-text mt-4 lg:mt-8">
                  <p className="sub-text font-bold text-lg animate-pulse" style={{ color: 'var(--primary-pink)' }}>
                    Preparing plates... ✨
                  </p>
                </div>
              )}
              </>
            ) : (
              <div className="serving-container fade-in-section flex flex-col items-center justify-center w-full min-h-[400px]">
                {!(isNoteVisible || isTransitioningNote) && (
                  <>
                    <h2 className="text-2xl md:text-3xl font-romantic text-primary-pink mb-2 text-center text-glow" style={{ textShadow: "0 2px 4px rgba(0,0,0,0.5)" }}>
                      The cake is ready... but each piece has a little secret ❤️
                    </h2>
                    <p className="text-gray-200 text-sm md:text-base animate-pulse mb-8" style={{ textShadow: "0 1px 3px rgba(0,0,0,0.8)" }}>
                      Tap the cake piece to reveal a note 💌
                    </p>
                  </>
                )}

                {!isNoteVisible && (
                  <div className="serving-scene-3d">
                    <div className="serving-plate-container">
                      <div className="serving-plate"></div>
                      <button 
                        key={`piece-${currentPieceIndex}`}
                        className={`cake-slice-btn ${!isTransitioningNote ? 'clickable pulse-glow' : 'clicked-bounce'}`}
                        onClick={() => {
                          if (!isNoteVisible && !isTransitioningNote) {
                            setIsTransitioningNote(true);
                            setTimeout(() => {
                              setIsNoteVisible(true);
                              setIsTransitioningNote(false);
                            }, 900);
                          }
                        }}
                      >
                        <div className="cute-cake-piece">
                          <div className="cp-face cp-bottom"></div>
                          <div className="cp-face cp-back"></div>
                          <div className="cp-face cp-right"></div>
                          <div className="cp-face cp-left"></div>
                          <div className="cp-face cp-front"></div>
                          <div className="cp-face cp-top">
                            <div className="cp-frosting-dollop cp-dollop-1"></div>
                            <div className="cp-frosting-dollop cp-dollop-2"></div>
                            <div className="cp-heart animate-pulse">❤️</div>
                          </div>
                        </div>
                      </button>
                    </div>
                  </div>
                )}

                {/* Note Card Fullscreen */}
                {isNoteVisible && (
                  <div className="note-card-container flex flex-col items-center justify-center fade-in-up w-full flex-grow mt-4 z-30">
                    <div className="note-card-fullscreen relative w-full max-w-lg bg-white bg-opacity-95 p-6 md:p-12 rounded-3xl border-2 border-pink-200 shadow-2xl">
                      <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-white rounded-full p-4 shadow-lg border border-pink-100 flex items-center justify-center">
                        <div className="note-card-heart animate-bounce" style={{ fontSize: '32px' }}>💌</div>
                      </div>
                      <h3 className="mt-4 md:mt-8 font-romantic text-3xl md:text-4xl font-bold text-rose-700">{LOVE_NOTES[currentPieceIndex].title}</h3>
                      <p className="mb-2 md:mb-4 mt-4 font-modern text-xl md:text-2xl text-rose-900 leading-relaxed italic border-t border-b border-pink-200 py-4 md:py-6 whitespace-pre-line">"{LOVE_NOTES[currentPieceIndex].text}"</p>
                      
                      {currentPieceIndex < 3 ? (
                        <div className="flex flex-col items-center gap-3 w-full mt-2">
                          <button 
                            className="serve-next-btn continue-btn w-full md:w-auto px-8 py-3 text-lg"
                            onClick={() => {
                              setIsNoteVisible(false);
                              setCurrentPieceIndex(prev => prev + 1);
                            }}
                          >
                            Serve Next Piece 🍰
                          </button>
                          <button 
                            className="text-rose-500 hover:text-rose-700 font-medium text-lg underline transition-colors"
                            onClick={() => setCurrentPieceIndex(prev => prev + 1)}
                          >
                            Next note ➡️
                          </button>
                        </div>
                      ) : (
                        <button 
                          className="continue-btn mt-2 w-full md:w-auto px-8 py-3 text-lg"
                          onClick={handleContinue}
                        >
                          Continue to Your Surprise ✨
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
            </div>
          )}
        </div>
      </div>

      {burstCoords && (
        <BurstHearts 
          x={burstCoords.x} 
          y={burstCoords.y} 
          onComplete={() => setBurstCoords(null)} 
        />
      )}
    </>
  );
}
