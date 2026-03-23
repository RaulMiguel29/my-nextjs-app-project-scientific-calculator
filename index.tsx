import { useState, useEffect, useRef } from 'react'
import Head from 'next/head'

type ScientificFunction = 'sin' | 'cos' | 'tan' | 'asin' | 'acos' | 'atan' | 'sinh' | 'cosh' | 'tanh' | 'log' | 'ln' | 'sqrt' | 'square' | 'cube' | 'power' | 'exp' | 'fact' | 'pi' | 'e'

export default function ScientificCalculator() {
  const [display, setDisplay] = useState('0')
  const [equation, setEquation] = useState('')
  const [memory, setMemory] = useState(0)
  const [angleMode, setAngleMode] = useState<'DEG' | 'RAD'>('DEG')
  const [shift, setShift] = useState(false)
  const [alpha, setAlpha] = useState(false)
  const [history, setHistory] = useState<string[]>([])
  const [showHistory, setShowHistory] = useState(false)
  const [lastAnswer, setLastAnswer] = useState(0)
  const displayRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (displayRef.current) {
      displayRef.current.scrollLeft = displayRef.current.scrollWidth
    }
  }, [display])

  const toRadians = (degrees: number) => degrees * (Math.PI / 180)
  const toDegrees = (radians: number) => radians * (180 / Math.PI)

  const evaluateExpression = (expr: string): number => {
    try {
      // Replace mathematical constants and functions
      let processed = expr
        .replace(/π/g, Math.PI.toString())
        .replace(/e/g, Math.E.toString())
        .replace(/ans/g, lastAnswer.toString())
      
      // Handle scientific functions
      const functions: { [key: string]: (x: number) => number } = {
        sin: (x: number) => angleMode === 'DEG' ? Math.sin(toRadians(x)) : Math.sin(x),
        cos: (x: number) => angleMode === 'DEG' ? Math.cos(toRadians(x)) : Math.cos(x),
        tan: (x: number) => angleMode === 'DEG' ? Math.tan(toRadians(x)) : Math.tan(x),
        asin: (x: number) => angleMode === 'DEG' ? toDegrees(Math.asin(x)) : Math.asin(x),
        acos: (x: number) => angleMode === 'DEG' ? toDegrees(Math.acos(x)) : Math.acos(x),
        atan: (x: number) => angleMode === 'DEG' ? toDegrees(Math.atan(x)) : Math.atan(x),
        sinh: (x: number) => Math.sinh(x),
        cosh: (x: number) => Math.cosh(x),
        tanh: (x: number) => Math.tanh(x),
        log: (x: number) => Math.log10(x),
        ln: (x: number) => Math.log(x),
        sqrt: (x: number) => Math.sqrt(x),
        exp: (x: number) => Math.exp(x),
      }

      for (const [func, impl] of Object.entries(functions)) {
        const regex = new RegExp(`${func}\\(([^)]+)\\)`, 'g')
        processed = processed.replace(regex, (_, arg) => {
          const val = evaluateExpression(arg)
          return impl(val).toString()
        })
      }

      // Handle power and square
      processed = processed.replace(/(\d+)\^(\d+)/g, (_, base, exp) => Math.pow(parseFloat(base), parseFloat(exp)).toString())
      processed = processed.replace(/(\d+)²/g, (_, num) => Math.pow(parseFloat(num), 2).toString())
      processed = processed.replace(/(\d+)³/g, (_, num) => Math.pow(parseFloat(num), 3).toString())
      
      // Evaluate the expression
      const result = Function(`"use strict"; return (${processed})`)()
      return isNaN(result) || !isFinite(result) ? 0 : result
    } catch {
      return 0
    }
  }

  const handleNumber = (num: string) => {
    if (display === '0' && !display.includes('.')) {
      setDisplay(num)
    } else {
      setDisplay(display + num)
    }
  }

  const handleOperator = (op: string) => {
    setEquation(equation + display + op)
    setDisplay('0')
  }

  const handleFunction = (func: ScientificFunction) => {
    let value = parseFloat(display)
    let result = 0

    switch (func) {
      case 'sin':
        result = angleMode === 'DEG' ? Math.sin(toRadians(value)) : Math.sin(value)
        break
      case 'cos':
        result = angleMode === 'DEG' ? Math.cos(toRadians(value)) : Math.cos(value)
        break
      case 'tan':
        result = angleMode === 'DEG' ? Math.tan(toRadians(value)) : Math.tan(value)
        break
      case 'asin':
        result = angleMode === 'DEG' ? toDegrees(Math.asin(value)) : Math.asin(value)
        break
      case 'acos':
        result = angleMode === 'DEG' ? toDegrees(Math.acos(value)) : Math.acos(value)
        break
      case 'atan':
        result = angleMode === 'DEG' ? toDegrees(Math.atan(value)) : Math.atan(value)
        break
      case 'sinh':
        result = Math.sinh(value)
        break
      case 'cosh':
        result = Math.cosh(value)
        break
      case 'tanh':
        result = Math.tanh(value)
        break
      case 'log':
        result = Math.log10(value)
        break
      case 'ln':
        result = Math.log(value)
        break
      case 'sqrt':
        result = Math.sqrt(value)
        break
      case 'square':
        result = Math.pow(value, 2)
        break
      case 'cube':
        result = Math.pow(value, 3)
        break
      case 'exp':
        result = Math.exp(value)
        break
      case 'fact':
        result = factorial(value)
        break
      case 'pi':
        setDisplay(display + Math.PI.toString())
        return
      case 'e':
        setDisplay(display + Math.E.toString())
        return
    }

    setDisplay(result.toString())
    setLastAnswer(result)
    addToHistory(`${func}(${value}) = ${result}`)
  }

  const factorial = (n: number): number => {
    if (n < 0) return 0
    if (n === 0 || n === 1) return 1
    let result = 1
    for (let i = 2; i <= n; i++) result *= i
    return result
  }

  const handleEqual = () => {
    const fullEquation = equation + display
    try {
      const result = evaluateExpression(fullEquation)
      setDisplay(result.toString())
      setLastAnswer(result)
      addToHistory(`${fullEquation} = ${result}`)
      setEquation('')
    } catch {
      setDisplay('Error')
      setTimeout(() => setDisplay('0'), 1500)
    }
  }

  const handleClear = () => {
    setDisplay('0')
    setEquation('')
  }

  const handleClearAll = () => {
    setDisplay('0')
    setEquation('')
    setMemory(0)
    setHistory([])
  }

  const handleDelete = () => {
    if (display.length === 1) {
      setDisplay('0')
    } else {
      setDisplay(display.slice(0, -1))
    }
  }

  const handleDecimal = () => {
    if (!display.includes('.')) {
      setDisplay(display + '.')
    }
  }

  const handleSignChange = () => {
    setDisplay((parseFloat(display) * -1).toString())
  }

  const handlePercentage = () => {
    setDisplay((parseFloat(display) / 100).toString())
  }

  const handlePower = () => {
    setEquation(equation + display + '^')
    setDisplay('0')
  }

  const handleMemoryStore = () => {
    setMemory(parseFloat(display))
  }

  const handleMemoryRecall = () => {
    setDisplay(memory.toString())
  }

  const handleMemoryAdd = () => {
    setMemory(memory + parseFloat(display))
  }

  const handleMemorySubtract = () => {
    setMemory(memory - parseFloat(display))
  }

  const handleMemoryClear = () => {
    setMemory(0)
  }

  const addToHistory = (entry: string) => {
    setHistory(prev => [entry, ...prev].slice(0, 20))
  }

  const clearHistory = () => {
    setHistory([])
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(display)
  }

  const Button = ({ onClick, children, className = "", disabled = false }: any) => (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`relative overflow-hidden rounded-xl font-semibold transition-all duration-200 active:scale-95 hover:shadow-lg ${className}`}
    >
      {children}
    </button>
  )

  return (
    <>
      <Head>
        <title>Scientific Calculator | Advanced Mathematics</title>
        <meta name="description" content="Modern scientific calculator with advanced mathematical functions" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
        <div className="w-full max-w-5xl">
          {/* Calculator Card */}
          <div className="bg-gray-900/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-gray-700 overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-xl backdrop-blur-lg">
                    🧮
                  </div>
                  <div>
                    <h1 className="text-white font-bold">Scientific Calculator</h1>
                    <p className="text-purple-200 text-xs">Advanced Mathematics</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setAngleMode(angleMode === 'DEG' ? 'RAD' : 'DEG')}
                    className="px-3 py-1 bg-white/20 rounded-lg text-white text-sm font-semibold hover:bg-white/30 transition"
                  >
                    {angleMode}
                  </button>
                  <button
                    onClick={() => setShowHistory(!showHistory)}
                    className="px-3 py-1 bg-white/20 rounded-lg text-white text-sm hover:bg-white/30 transition"
                  >
                    📜
                  </button>
                </div>
              </div>
            </div>

            {/* Display */}
            <div className="p-6 bg-black/30 border-b border-gray-700">
              <div className="text-right">
                <div className="text-gray-400 text-sm mb-2 font-mono min-h-[24px]">
                  {equation || ' '}
                </div>
                <div
                  ref={displayRef}
                  className="text-5xl md:text-6xl font-bold text-white font-mono overflow-x-auto whitespace-nowrap scrollbar-hide"
                >
                  {display}
                </div>
              </div>
            </div>

            {/* Calculator Body */}
            <div className="p-6">
              {!showHistory ? (
                <>
                  {/* Scientific Functions Row */}
                  <div className="grid grid-cols-6 gap-2 mb-4">
                    <Button onClick={() => handleFunction('sin')} className="bg-purple-700 hover:bg-purple-600 text-white text-sm">sin</Button>
                    <Button onClick={() => handleFunction('cos')} className="bg-purple-700 hover:bg-purple-600 text-white text-sm">cos</Button>
                    <Button onClick={() => handleFunction('tan')} className="bg-purple-700 hover:bg-purple-600 text-white text-sm">tan</Button>
                    <Button onClick={() => handleFunction('asin')} className="bg-purple-800 hover:bg-purple-700 text-white text-xs">sin⁻¹</Button>
                    <Button onClick={() => handleFunction('acos')} className="bg-purple-800 hover:bg-purple-700 text-white text-xs">cos⁻¹</Button>
                    <Button onClick={() => handleFunction('atan')} className="bg-purple-800 hover:bg-purple-700 text-white text-xs">tan⁻¹</Button>
                    
                    <Button onClick={() => handleFunction('sinh')} className="bg-indigo-700 hover:bg-indigo-600 text-white text-sm">sinh</Button>
                    <Button onClick={() => handleFunction('cosh')} className="bg-indigo-700 hover:bg-indigo-600 text-white text-sm">cosh</Button>
                    <Button onClick={() => handleFunction('tanh')} className="bg-indigo-700 hover:bg-indigo-600 text-white text-sm">tanh</Button>
                    <Button onClick={() => handleFunction('log')} className="bg-indigo-800 hover:bg-indigo-700 text-white text-sm">log₁₀</Button>
                    <Button onClick={() => handleFunction('ln')} className="bg-indigo-800 hover:bg-indigo-700 text-white text-sm">ln</Button>
                    <Button onClick={() => handleFunction('exp')} className="bg-indigo-800 hover:bg-indigo-700 text-white text-sm">eˣ</Button>
                    
                    <Button onClick={() => handleFunction('sqrt')} className="bg-cyan-700 hover:bg-cyan-600 text-white text-sm">√</Button>
                    <Button onClick={() => handleFunction('square')} className="bg-cyan-700 hover:bg-cyan-600 text-white text-sm">x²</Button>
                    <Button onClick={() => handleFunction('cube')} className="bg-cyan-700 hover:bg-cyan-600 text-white text-sm">x³</Button>
                    <Button onClick={handlePower} className="bg-cyan-800 hover:bg-cyan-700 text-white text-sm">xʸ</Button>
                    <Button onClick={() => handleFunction('fact')} className="bg-cyan-800 hover:bg-cyan-700 text-white text-sm">n!</Button>
                    <Button onClick={() => handleFunction('pi')} className="bg-cyan-800 hover:bg-cyan-700 text-white text-sm">π</Button>
                  </div>

                  {/* Memory Functions Row */}
                  <div className="grid grid-cols-5 gap-2 mb-4">
                    <Button onClick={handleMemoryStore} className="bg-gray-700 hover:bg-gray-600 text-white text-xs">MS</Button>
                    <Button onClick={handleMemoryRecall} className="bg-gray-700 hover:bg-gray-600 text-white text-xs">MR</Button>
                    <Button onClick={handleMemoryAdd} className="bg-gray-700 hover:bg-gray-600 text-white text-xs">M+</Button>
                    <Button onClick={handleMemorySubtract} className="bg-gray-700 hover:bg-gray-600 text-white text-xs">M-</Button>
                    <Button onClick={handleMemoryClear} className="bg-gray-700 hover:bg-gray-600 text-white text-xs">MC</Button>
                  </div>

                  {/* Main Keypad */}
                  <div className="grid grid-cols-5 gap-2">
                    <Button onClick={handleClearAll} className="bg-red-600 hover:bg-red-700 text-white">AC</Button>
                    <Button onClick={handleClear} className="bg-orange-600 hover:bg-orange-700 text-white">C</Button>
                    <Button onClick={handleDelete} className="bg-yellow-600 hover:bg-yellow-700 text-white">⌫</Button>
                    <Button onClick={() => handleOperator('/')} className="bg-purple-600 hover:bg-purple-700 text-white text-2xl">÷</Button>
                    <Button onClick={handlePercentage} className="bg-purple-600 hover:bg-purple-700 text-white">%</Button>
                    
                    <Button onClick={() => handleNumber('7')} className="bg-gray-800 hover:bg-gray-700 text-white text-2xl">7</Button>
                    <Button onClick={() => handleNumber('8')} className="bg-gray-800 hover:bg-gray-700 text-white text-2xl">8</Button>
                    <Button onClick={() => handleNumber('9')} className="bg-gray-800 hover:bg-gray-700 text-white text-2xl">9</Button>
                    <Button onClick={() => handleOperator('*')} className="bg-purple-600 hover:bg-purple-700 text-white text-2xl">×</Button>
                    <Button onClick={handleFunction('sqrt')} className="bg-cyan-700 hover:bg-cyan-600 text-white">√</Button>
                    
                    <Button onClick={() => handleNumber('4')} className="bg-gray-800 hover:bg-gray-700 text-white text-2xl">4</Button>
                    <Button onClick={() => handleNumber('5')} className="bg-gray-800 hover:bg-gray-700 text-white text-2xl">5</Button>
                    <Button onClick={() => handleNumber('6')} className="bg-gray-800 hover:bg-gray-700 text-white text-2xl">6</Button>
                    <Button onClick={() => handleOperator('-')} className="bg-purple-600 hover:bg-purple-700 text-white text-2xl">-</Button>
                    <Button onClick={handleFunction('square')} className="bg-cyan-700 hover:bg-cyan-600 text-white">x²</Button>
                    
                    <Button onClick={() => handleNumber('1')} className="bg-gray-800 hover:bg-gray-700 text-white text-2xl">1</Button>
                    <Button onClick={() => handleNumber('2')} className="bg-gray-800 hover:bg-gray-700 text-white text-2xl">2</Button>
                    <Button onClick={() => handleNumber('3')} className="bg-gray-800 hover:bg-gray-700 text-white text-2xl">3</Button>
                    <Button onClick={() => handleOperator('+')} className="bg-purple-600 hover:bg-purple-700 text-white text-2xl">+</Button>
                    <Button onClick={handleFunction('cube')} className="bg-cyan-700 hover:bg-cyan-600 text-white">x³</Button>
                    
                    <Button onClick={handleSignChange} className="bg-gray-700 hover:bg-gray-600 text-white">±</Button>
                    <Button onClick={() => handleNumber('0')} className="bg-gray-800 hover:bg-gray-700 text-white text-2xl col-span-2">0</Button>
                    <Button onClick={handleDecimal} className="bg-gray-800 hover:bg-gray-700 text-white text-2xl">.</Button>
                    <Button onClick={handleEqual} className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white text-2xl font-bold">=</Button>
                  </div>

                  {/* Additional Info */}
                  <div className="mt-4 text-center text-gray-500 text-xs">
                    <span className="inline-flex items-center gap-2">
                      <span>📐 {angleMode} Mode</span>
                      <span>•</span>
                      <span>💾 Memory: {memory}</span>
                      <span>•</span>
                      <span>🔄 Last Answer: {lastAnswer}</span>
                    </span>
                  </div>
                </>
              ) : (
                // History Panel
                <div className="min-h-[500px]">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-white font-semibold text-lg">Calculation History</h3>
                    <button
                      onClick={clearHistory}
                      className="px-3 py-1 bg-red-600 hover:bg-red-700 rounded-lg text-white text-sm"
                    >
                      Clear All
                    </button>
                  </div>
                  <div className="space-y-2 max-h-[500px] overflow-y-auto">
                    {history.length === 0 ? (
                      <div className="text-center text-gray-500 py-12">
                        <div className="text-4xl mb-2">📊</div>
                        <p>No calculations yet</p>
                      </div>
                    ) : (
                      history.map((entry, index) => (
                        <div
                          key={index}
                          className="bg-gray-800 rounded-lg p-3 hover:bg-gray-700 transition cursor-pointer"
                          onClick={() => {
                            const result = entry.split(' = ')[1]
                            if (result) setDisplay(result)
                            setShowHistory(false)
                          }}
                        >
                          <div className="text-gray-400 text-sm font-mono">{entry}</div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Keyboard Shortcuts Hint */}
          <div className="mt-4 text-center text-gray-500 text-xs">
            <div className="inline-flex flex-wrap justify-center gap-3 bg-gray-800/50 backdrop-blur-lg rounded-lg px-4 py-2">
              <span>⌨️ Keyboard Support:</span>
              <span>0-9</span>
              <span>+ - * /</span>
              <span>Enter =</span>
              <span>Escape (AC)</span>
              <span>Backspace (⌫)</span>
              <span>s (sin)</span>
              <span>c (cos)</span>
              <span>t (tan)</span>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fade-in {
          animation: fadeIn 0.5s ease-out;
        }
        
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }
        
        button {
          position: relative;
          overflow: hidden;
        }
        
        button::before {
          content: '';
          position: absolute;
          top: 50%;
          left: 50%;
          width: 0;
          height: 0;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.3);
          transform: translate(-50%, -50%);
          transition: width 0.3s, height 0.3s;
        }
        
        button:active::before {
          width: 100%;
          height: 100%;
          transition: 0s;
        }
      `}</style>
    </>
  )
}