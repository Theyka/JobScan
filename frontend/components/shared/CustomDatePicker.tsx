'use client'

import { useState, useRef, useEffect } from 'react'

type CustomDatePickerProps = {
    name: string
    defaultValue?: string
    label?: string
}

export default function CustomDatePicker({ name, defaultValue = '', label }: CustomDatePickerProps) {
    const [selectedDate, setSelectedDate] = useState(defaultValue)
    const [isOpen, setIsOpen] = useState(false)
    const [viewDate, setViewDate] = useState(new Date(defaultValue || new Date()))
    const containerRef = useRef<HTMLDivElement>(null)

    // Close on outside click
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate()
    const startDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay()

    const handlePrevMonth = () => {
        setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1))
    }

    const handleNextMonth = () => {
        setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1))
    }

    const handleSelectDate = (day: number) => {
        const date = new Date(viewDate.getFullYear(), viewDate.getMonth(), day)
        const formatted = date.toISOString().split('T')[0]
        setSelectedDate(formatted)
        setIsOpen(false)
    }

    const isSelected = (day: number) => {
        if (!selectedDate) return false
        const date = new Date(viewDate.getFullYear(), viewDate.getMonth(), day)
        return date.toISOString().split('T')[0] === selectedDate
    }

    const isToday = (day: number) => {
        const today = new Date()
        const date = new Date(viewDate.getFullYear(), viewDate.getMonth(), day)
        return date.toDateString() === today.toDateString()
    }

    const monthName = viewDate.toLocaleString('default', { month: 'long' })
    const year = viewDate.getFullYear()

    const days = []
    const totalDays = daysInMonth(year, viewDate.getMonth())
    const startDay = startDayOfMonth(year, viewDate.getMonth())

    // Padding for start day
    for (let i = 0; i < startDay; i++) {
        days.push(<div key={`pad-${i}`} className="h-8 w-8" />)
    }

    // Days of month
    for (let d = 1; d <= totalDays; d++) {
        days.push(
            <button
                key={d}
                type="button"
                onClick={() => handleSelectDate(d)}
                className={`flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold transition-all hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-500/20 dark:hover:text-indigo-300 ${isSelected(d)
                    ? 'bg-indigo-600 text-white hover:bg-indigo-700 dark:bg-indigo-500 dark:text-white'
                    : isToday(d)
                        ? 'text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/30'
                        : 'text-slate-600 dark:text-slate-400'
                    }`}
            >
                {d}
            </button>
        )
    }

    return (
        <div className="relative" ref={containerRef}>
            <input type="hidden" name={name} value={selectedDate} />
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 rounded-xl bg-transparent text-xs font-bold tracking-tight text-slate-700 outline-none transition-colors hover:text-indigo-600 dark:text-slate-200 dark:hover:text-indigo-400"
            >
                <svg className="h-4 w-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span>{selectedDate || 'Select date'}</span>
            </button>

            {isOpen && (
                <div className="absolute top-full right-0 sm:left-0 z-[60] mt-3 w-64 origin-top-right sm:origin-top-left rounded-2xl border border-slate-200 bg-white p-4 shadow-xl dark:border-slate-800 dark:bg-slate-900">
                    <div className="mb-4 flex items-center justify-between">
                        <button
                            type="button"
                            onClick={handlePrevMonth}
                            className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800"
                        >
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>
                        <span className="text-xs font-black uppercase tracking-widest text-slate-900 dark:text-white">
                            {monthName} {year}
                        </span>
                        <button
                            type="button"
                            onClick={handleNextMonth}
                            className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800"
                        >
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                            </svg>
                        </button>
                    </div>

                    <div className="grid grid-cols-7 gap-1">
                        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((wd) => (
                            <div key={wd} className="flex h-8 w-8 items-center justify-center text-[10px] font-black uppercase tracking-widest text-slate-400">
                                {wd}
                            </div>
                        ))}
                        {days}
                    </div>
                </div>
            )}
        </div>
    )
}
