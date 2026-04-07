'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface PaginationProps {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    className?: string;
}

export function Pagination({ currentPage, totalPages, onPageChange, className }: PaginationProps) {
    if (totalPages <= 1) return null;

    const pages = Array.from({ length: totalPages }, (_, i) => i + 1)
        .filter(page => {
            if (totalPages <= 7) return true;
            if (page === 1 || page === totalPages) return true;
            if (Math.abs(page - currentPage) <= 1) return true;
            return false;
        })
        .reduce<(number | 'ellipsis')[]>((acc, page, i, arr) => {
            if (i > 0 && page - (arr[i - 1] as number) > 1) {
                acc.push('ellipsis');
            }
            acc.push(page);
            return acc;
        }, []);

    return (
        <div className={cn("flex items-center justify-center gap-2", className)}>
            <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="h-8 w-8 p-0 rounded-full cursor-pointer"
            >
                <ChevronLeft className="h-4 w-4" />
            </Button>

            {pages.map((item, i) =>
                item === 'ellipsis' ? (
                    <span key={`e-${i}`} className="text-[11px] text-gray-400 px-1">...</span>
                ) : (
                    <Button
                        key={item}
                        variant={currentPage === item ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => onPageChange(item)}
                        className={cn(
                            "h-8 w-8 p-0 rounded-full text-xs cursor-pointer",
                            currentPage === item && "pointer-events-none"
                        )}
                    >
                        {item}
                    </Button>
                )
            )}

            <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="h-8 w-8 p-0 rounded-full cursor-pointer"
            >
                <ChevronRight className="h-4 w-4" />
            </Button>
        </div>
    );
}
