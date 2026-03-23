import { useState, useEffect, useRef, useCallback } from 'react'
import Head from 'next/head'

type ScientificFunction = 'sin' | 'cos' | 'tan' | 'asin' | 'acos' | 'atan' | 'sinh' | 'cosh' | 'tanh' | 'log' | 'ln' | 'sqrt' | 'square' | 'cube' | 'power' | 'exp' | 'fact' | 'pi' | 'e'

export default function ScientificCalculator() {
  const [display, setDisplay] = useState<string>('0')
  const [equation, setEquation] = useState<string>('')
  const [memory, setMemory] = useState<number>(0)
  const [angleMode, setAngleMode] = useState<'DEG' | 'RAD'>('DEG')
  const [history, setHistory] = useState<string[]>([])
  const [showHistory, setShowHistory] = useState<boolean>(false)
  const [lastAnswer, setLastAnswer] = useState<number>(0)
  const [error, setError] = useState<string>('')
  const displayRef = useRef<HTMLDivElement>(null)

  // Safe number parsing
  const safeParseFloat = (value: string): number => {
    const parsed = parseFloat(value)
    return isNaN(parsed) ? 0 : parsed
  }

  // Format display to avoid scientific notation for most numbers
  const formatDisplay = (value: number): string => {
    if (isNaN(value) || !isFinite(value)) return '0'
    if (Math.abs(value) > 1e12 || (Math.abs(value) < 1e-6 && value !== 0)) {
      return value.toExponential(8)
    }
    // Remove trailing zeros after decimal
    const str = value.toString()
    return str.includes('.') ? str.replace(/\.?0+$/, '') : str
  }

  // Safe evaluate expression
  const evaluateExpression = useCallback((expr: string): number => {
    if (!expr.trim()) return 0
    
    try {
      let processed = expr
        .replace(/π/g, Math.PI.toString())
        .replace(/e(?![a-z])/g, Math.E.toString())
        .replace(/ans/g, lastAnswer.toString())
        .replace(/\s/g, '')
      
      // Handle factorial
      processed = processed.replace(/(\d+)!/g, (_, num) => {
        const n = parseInt(num)
        if (n < 0 || n > 170) return '0'
        let fact = 1
        for (let i = 2; i <= n; i++) fact *= i
        return fact.toString()
      })
      
      // Handle power
      processed = processed.replace(/(\d+(?:\.\d+)?)\^(\d+(?:\.\d+)?)/g, (_, base, exp) => 
        Math.pow(parseFloat(base), parseFloat(exp)).toString()
      )
      
      // Handle square
      processed = processed.replace(/(\d+(?:\.\d+)?)²/g, (_, num) => 
        Math.pow(parseFloat(num), 2).toString()
      )
      
      // Handle cube
      processed = processed.replace(/(\d+(?:\.\d+)?)³/g, (_, num) => 
        Math.pow(parseFloat(num), 3).toString()
      )
      
      // Handle trigonometric and other functions
      const functions: { [key: string]: (x: number) => number } = {
        sin: (x: number) => angleMode === 'DEG' ? Math.sin(x * Math.PI / 180) : Math.sin(x),
        cos: (x: number) => angleMode === 'DEG' ? Math.cos(x * Math.PI / 180) : Math.cos(x),
        tan: (x: number) => angleMode === 'DEG' ? Math.tan(x * Math.PI / 180) : Math.tan(x),
        asin: (x: number) => {
          const val = Math.asin(x)
          return angleMode === 'DEG' ? val * 180 / Math.PI : val
        },
        acos: (x: number) => {
          const val = Math.acos(x)
          return angleMode === 'DEG' ? val * 180 / Math.PI : val
        },
        atan: (x: number) => {
          const val = Math.atan(x)
          return angleMode === 'DEG' ? val * 180 / Math.PI : val
        },
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
          try {
            const val = evaluateExpression(arg)
            const result = impl(val)
            return isNaN(result) || !isFinite(result) ? '0' : result.toString()
          } catch {
            return '0'
          }
        })
      }
      
      // Final evaluation
      // eslint-disable-next-line no-new-func
      const result = Function(`"use strict"; return (${processed})`)()
      return isNaN(result) || !isFinite(result) ? 0 : result
    } catch (err) {
      console.error('Evaluation error:', err)
      return 0
    }
  }, [angleMode, lastAnswer])

  // Add to history
  const addToHistory = useCallback((entry: string) => {
    setHistory(prev => {
      const newHistory = [entry, ...prev]
      return newHistory.slice(0, 20)
    })
  }, [])

  // Handle number input
  const handleNumber = useCallback((num: string) => {
    setError('')
    if (display === '0' && !display.includes('.')) {
      setDisplay(num)
    } else {
      setDisplay(prev => prev + num)
    }
  }, [display])

  // Handle operator
  const handleOperator = useCallback((op: string) => {
    setError('')
    setEquation(prev => prev + display + op)
    setDisplay('0')
  }, [display])

  // Handle function
  const handleFunction = useCallback((func: ScientificFunction) => {
    setError('')
    const value = safeParseFloat(display)
    let result = 0

    try {
      switch (func) {
        case 'sin':
          result = angleMode === 'DEG' ? Math.sin(value * Math.PI / 180) : Math.sin(value)
          break
        case 'cos':
          result = angleMode === 'DEG' ? Math.cos(value * Math.PI / 180) : Math.cos(value)
          break
        case 'tan':
          result = angleMode === 'DEG' ? Math.tan(value * Math.PI / 180) : Math.tan(value)
          break
        case 'asin':
          if (value < -1 || value > 1) {
            setError('Input out of range (-1 to 1)')
            return
          }
          result = angleMode === 'DEG' ? Math.asin(value) * 180 / Math.PI : Math.asin(value)
          break
        case 'acos':
          if (value < -1 || value > 1) {
            setError('Input out of range (-1 to 1)')
            return
          }
          result = angleMode === 'DEG' ? Math.acos(value) * 180 / Math.PI : Math.acos(value)
          break
        case 'atan':
          result = angleMode === 'DEG' ? Math.atan(value) * 180 / Math.PI : Math.atan(value)
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
          if (value <= 0) {
            setError('Logarithm undefined for non-positive numbers')
            return
          }
          result = Math.log10(value)
          break
        case 'ln':
          if (value <= 0) {
            setError('Natural log undefined for non-positive numbers')
            return
          }
          result = Math.log(value)
          break
        case 'sqrt':
          if (value < 0) {
            setError('Square root undefined for negative numbers')
            return
          }
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
          if (value < 0 || value > 170) {
            setError('Factorial undefined for negative numbers or > 170')
            return
          }
          let fact = 1
          for (let i = 2; i <= Math.floor(value); i++) fact *= i
          result = fact
          break
        case 'pi':
          setDisplay(prev => prev + Math.PI.toString())
          return
        case 'e':
          setDisplay(prev => prev + Math.E.toString())
          return
      }

      const formattedResult = formatDisplay(result)
      setDisplay(formattedResult)
      setLastAnswer(result)
      addToHistory(`${func}(${display}) = ${formattedResult}`)
    } catch (err) {
      setError('Calculation error')
      console.error('Function error:', err)
    }
  }, [display, angleMode, addToHistory])

  // Handle equals
  const handleEqual = useCallback(() => {
    setError('')
    const fullEquation = equation + display
    if (!fullEquation.trim()) return
    
    try {
      const result = evaluateExpression(fullEquation)
      const formattedResult = formatDisplay(result)
      setDisplay(formattedResult)
      setLastAnswer(result)
      addToHistory(`${fullEquation} = ${formattedResult}`)
      setEquation('')
    } catch (err) {
      setError('Invalid expression')
      console.error('Equal error:', err)
      setTimeout(() => setError(''), 2000)
    }
  }, [equation, display, evaluateExpression, addToHistory])

  // Handle clear
  const handleClear = useCallback(() => {
    setError('')
    setDisplay('0')
    setEquation('')
  }, [])

  // Handle clear all
  const handleClearAll = useCallback(() => {
    setError('')
    setDisplay('0')
    setEquation('')
    setMemory(0)
    setHistory([])
  }, [])

  // Handle delete
  const handleDelete = useCallback(() => {
    setError('')
    if (display.length === 1) {
      setDisplay('0')
    } else {
      setDisplay(prev => prev.slice(0, -1))
    }
  }, [display])

  // Handle decimal
  const handleDecimal = useCallback(() => {
    setError('')
    if (!display.includes('.')) {
      setDisplay(prev => prev + '.')
    }
  }, [display])

  // Handle sign change
  const handleSignChange = useCallback(() => {
    setError('')
    const value = safeParseFloat(display)
    setDisplay(formatDisplay(-value))
  }, [display])

  // Handle percentage
  const handlePercentage = useCallback(() => {
    setError('')
    const value = safeParseFloat(display)
    setDisplay(formatDisplay(value / 100))
  }, [display])

  // Handle power
  const handlePower = useCallback(() => {
    setError('')
    setEquation(prev => prev + display + '^')
    setDisplay('0')
  }, [display])

  // Memory functions
  const handleMemoryStore = useCallback(() => {
    setMemory(safeParseFloat(display))
    setError('')
  }, [display])

  const handleMemoryRecall = useCallback(() => {
    setDisplay(formatDisplay(memory))
    setError('')
  }, [memory])

  const handleMemoryAdd = useCallback(() => {
    setMemory(prev => prev + safeParseFloat(display))
    setError('')
  }, [display])

  const handleMemorySubtract = useCallback(() => {
    setMemory(prev => prev - safeParseFloat(display))
    setError('')
  }, [display])

  const handleMemoryClear = useCallback(() => {
    setMemory(0)
    setError('')
  }, [])

  const clearHistory = useCallback(() => {
    setHistory([])
  }, [])

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(display)
    setError('Copied!')
    setTimeout(() => setError(''), 1500)
  }, [display])

  // Keyboard support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key
      
      if (/[0-9]/.test(key)) {
        e.preventDefault()
        handleNumber(key)
      } else if (key === '+') {
        e.preventDefault()
        handleOperator('+')
      } else if (key === '-') {
        e.preventDefault()
        handleOperator('-')
      } else if (key === '*') {
        e.preventDefault()
        handleOperator('*')
      } else if (key === '/') {
        e.preventDefault()
        handleOperator('/')
      } else if (key === 'Enter' || key === '=') {
        e.preventDefault()
        handleEqual()
      } else if (key === 'Escape') {
        e.preventDefault()
        handleClearAll()
      } else if (key === 'Backspace') {
        e.preventDefault()
        handleDelete()
      } else if (key === '.') {
        e.preventDefault()
        handleDecimal()
      } else if (key === '%') {
        e.preventDefault()
        handlePercentage()
      } else if (key === 's') {
        e.preventDefault()
        handleFunction('sin')
      } else if (key === 'c') {
        e.preventDefault()
        handleFunction('cos')
      } else if (key === 't') {
        e.preventDefault()
        handleFunction('tan')
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleNumber, handleOperator, handleEqual, handleClearAll, handleDelete, handleDecimal, handlePercentage, handleFunction])

  // Scroll display
  useEffect(() => {
    if (displayRef.current) {
      displayRef.current.scrollLeft = displayRef.current.scrollWidth
    }
  }, [display])

  const Button = ({ onClick, children, className = "", disabled = false, title = "" }: any) => (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`relative overflow-hidden rounded-xl font-semibold transition-all duration-200 active:scale-95 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
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
                  <button
                    onClick={handleCopy}
                    className="px-3 py-1 bg-white/20 rounded-lg text-white text-sm hover:bg-white/30 transition"
                    title="Copy result"
                  >
                    📋
                  </button>
                </div>
              </div>
            </div>

            {/* Display */}
            <div className="p-6 bg-black/30 border-b border-gray-700">
              <div className="text-right">
                <div className="text-gray-400 text-sm mb-2 font-mono min-h-[24px] break-all">
                  {equation || '\u00A0'}
                </div>
                <div
                  ref={displayRef}
                  className="text-4xl md:text-5xl font-bold text-white font-mono overflow-x-auto whitespace-nowrap scrollbar-hide"
                >
                  {display}
                </div>
                {error && (
                  <div className="text-red-400 text-sm mt-2 animate-pulse">
                    {error}
                  </div>
                )}
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
                    <Button onClick={() => handleFunction('sqrt')} className="bg-cyan-700 hover:bg-cyan-600 text-white">√</Button>
                    
                    <Button onClick={() => handleNumber('4')} className="bg-gray-800 hover:bg-gray-700 text-white text-2xl">4</Button>
                    <Button onClick={() => handleNumber('5')} className="bg-gray-800 hover:bg-gray-700 text-white text-2xl">5</Button>
                    <Button onClick={() => handleNumber('6')} className="bg-gray-800 hover:bg-gray-700 text-white text-2xl">6</Button>
                    <Button onClick={() => handleOperator('-')} className="bg-purple-600 hover:bg-purple-700 text-white text-2xl">-</Button>
                    <Button onClick={() => handleFunction('square')} className="bg-cyan-700 hover:bg-cyan-600 text-white">x²</Button>
                    
                    <Button onClick={() => handleNumber('1')} className="bg-gray-800 hover:bg-gray-700 text-white text-2xl">1</Button>
                    <Button onClick={() => handleNumber('2')} className="bg-gray-800 hover:bg-gray-700 text-white text-2xl">2</Button>
                    <Button onClick={() => handleNumber('3')} className="bg-gray-800 hover:bg-gray-700 text-white text-2xl">3</Button>
                    <Button onClick={() => handleOperator('+')} className="bg-purple-600 hover:bg-purple-700 text-white text-2xl">+</Button>
                    <Button onClick={() => handleFunction('cube')} className="bg-cyan-700 hover:bg-cyan-600 text-white">x³</Button>
                    
                    <Button onClick={handleSignChange} className="bg-gray-700 hover:bg-gray-600 text-white">±</Button>
                    <Button onClick={() => handleNumber('0')} className="bg-gray-800 hover:bg-gray-700 text-white text-2xl col-span-2">0</Button>
                    <Button onClick={handleDecimal} className="bg-gray-800 hover:bg-gray-700 text-white text-2xl">.</Button>
                    <Button onClick={handleEqual} className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white text-2xl font-bold">=</Button>
                  </div>

                  {/* Additional Info */}
                  <div className="mt-4 text-center text-gray-500 text-xs">
                    <span className="inline-flex items-center gap-2 flex-wrap justify-center">
                      <span>📐 {angleMode} Mode</span>
                      <span>•</span>
                      <span>💾 Memory: {memory}</span>
                      <span>•</span>
                      <span>🔄 Last Answer: {formatDisplay(lastAnswer)}</span>
                      <span>•</span>
                      <span>⌨️ Keyboard enabled</span>
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
                          className="bg-gray-800 rounded-lg p-3 hover:bg-gray-700 transition cursor-pointer group"
                          onClick={() => {
                            const match = entry.match(/= (.+)$/)
                            if (match && match[1]) {
                              setDisplay(match[1])
                              setShowHistory(false)
                              setError('')
                            }
                          }}
                        >
                          <div className="text-gray-400 text-sm font-mono break-all">{entry}</div>
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
              <span>⌨️ Keyboard:</span>
              <span>0-9</span>
              <span>+ - * /</span>
              <span>Enter =</span>
              <span>Esc (AC)</span>
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
        
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
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
        
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }
        
        .animate-pulse {
          animation: pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
      `}</style>
    </>
  )
}