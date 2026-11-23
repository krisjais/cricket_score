'use client'

import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface AdminPaginationProps {
  currentPage: number
  totalPages: number
  totalItems: number
  pageSize: number
  onPageChange: (page: number) => void
  onPageSizeChange?: (size: number) => void
  pageSizeOptions?: number[]
  itemLabel?: string
  className?: string
}

export function AdminPagination({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 20, 50],
  itemLabel = 'entries',
  className,
}: AdminPaginationProps) {
  if (totalItems <= 0) return null

  const start = (currentPage - 1) * pageSize + 1
  const end = Math.min(currentPage * pageSize, totalItems)

  const getPageNumbers = (): (number | 'ellipsis')[] => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1)
    }

    if (currentPage <= 4) {
      return [1, 2, 3, 4, 5, 'ellipsis', totalPages]
    }

    if (currentPage >= totalPages - 3) {
      return [1, 'ellipsis', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages]
    }

    return [1, 'ellipsis', currentPage - 1, currentPage, currentPage + 1, 'ellipsis', totalPages]
  }

  const pages = getPageNumbers()

  return (
    <div
      className={cn(
        'flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-[#E5E7EB] bg-white text-xs',
        className
      )}
    >
      {/* Information & Page Size Selector */}
      <div className="flex flex-wrap items-center gap-3 text-gray-500 font-medium">
        <span>
          Showing <strong className="font-bold text-[#111827]">{start}</strong> to{' '}
          <strong className="font-bold text-[#111827]">{end}</strong> of{' '}
          <strong className="font-bold text-[#111827]">{totalItems}</strong> {itemLabel}
        </span>

        {onPageSizeChange && pageSizeOptions.length > 1 && (
          <div className="flex items-center gap-1.5 sm:pl-2 sm:border-l sm:border-gray-200">
            <span className="text-[11px] text-gray-400 uppercase font-semibold">Per page:</span>
            <Select
              value={String(pageSize)}
              onValueChange={(val) => onPageSizeChange(Number(val))}
            >
              <SelectTrigger
                size="sm"
                className="h-7 w-auto min-w-[58px] gap-1 px-2.5 py-0.5 rounded-lg border border-gray-200 bg-[#F9FAFB] text-xs font-bold text-gray-800 hover:bg-gray-50 focus-visible:ring-1 focus-visible:ring-[#7A1426] cursor-pointer shadow-none"
                aria-label="Select number of entries per page"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent align="end" className="min-w-[4.5rem]">
                {pageSizeOptions.map((opt) => (
                  <SelectItem key={opt} value={String(opt)} className="text-xs font-bold cursor-pointer">
                    {opt}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <nav aria-label="Pagination" className="flex items-center gap-1">
          {/* Previous Button */}
          <button
            type="button"
            disabled={currentPage <= 1}
            onClick={() => onPageChange(currentPage - 1)}
            className="inline-flex items-center gap-1 h-8 px-2.5 rounded-lg border border-gray-200 bg-white font-bold text-gray-700 hover:bg-gray-50 hover:text-gray-900 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
            aria-label="Previous page"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Prev</span>
          </button>

          {/* Numbered Page Buttons */}
          <div className="flex items-center gap-1">
            {pages.map((p, idx) => {
              if (p === 'ellipsis') {
                return (
                  <span
                    key={`ellipsis-${idx}`}
                    className="flex w-7 h-8 items-center justify-center text-gray-400"
                    aria-hidden
                  >
                    <MoreHorizontal className="w-3.5 h-3.5" />
                  </span>
                )
              }

              const isActive = p === currentPage
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => onPageChange(p)}
                  aria-current={isActive ? 'page' : undefined}
                  className={cn(
                    'h-8 min-w-[32px] px-2 rounded-lg font-bold transition-all cursor-pointer',
                    isActive
                      ? 'bg-[#7A1426] text-white border border-[#7A1426] shadow-2xs'
                      : 'border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                  )}
                >
                  {p}
                </button>
              )
            })}
          </div>

          {/* Next Button */}
          <button
            type="button"
            disabled={currentPage >= totalPages}
            onClick={() => onPageChange(currentPage + 1)}
            className="inline-flex items-center gap-1 h-8 px-2.5 rounded-lg border border-gray-200 bg-white font-bold text-gray-700 hover:bg-gray-50 hover:text-gray-900 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
            aria-label="Next page"
          >
            <span className="hidden sm:inline">Next</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </nav>
      )}
    </div>
  )
}

