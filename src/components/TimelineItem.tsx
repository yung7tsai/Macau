import React from 'react';
import { MapPin, Navigation, Clock, Users, ArrowRight } from 'lucide-react';
import { ItineraryItem } from '../types';
import { cn, getMapsLink } from '../lib/utils';
import { motion } from 'motion/react';

interface TimelineItemProps {
  item: ItineraryItem;
  onEdit?: (item: ItineraryItem) => void;
  isSplit?: boolean;
  showLine?: boolean;
}

export default function TimelineItemComponent({ item, onEdit, isSplit, showLine = true }: TimelineItemProps) {
  const isTransport = item.type === 'transport' || item.type === 'flight';
  const isRestaurant = item.type === 'restaurant';
  
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "relative mb-8",
        showLine ? "pl-4" : "pl-1"
      )}
    >
      {/* Connector Line */}
      {showLine && (
        <>
          <div className="absolute left-0 top-0 bottom-[-32px] w-px bg-zen-border" />
          <div className="absolute left-[-4px] top-2 w-2 h-2 rounded-full bg-zen-muted/30" />
        </>
      )}
      
      <div 
        onClick={() => onEdit?.(item)}
        className={cn(
          "zen-card p-4 cursor-pointer transition-all hover:border-zen-muted active:scale-[0.98] break-words overflow-hidden",
          item.column === 1 && "border-l-4 border-l-zen-accent/50",
          item.column === 2 && "border-l-4 border-l-blue-400/50",
          isSplit && "p-2 sm:p-3"
        )}
      >
        <div className="flex flex-wrap justify-between items-start gap-1 mb-2">
          <div className="flex items-center gap-1 text-[9px] font-bold text-zen-muted uppercase tracking-wider">
            <Clock size={10} />
            {item.startTime}
          </div>
          <div className={cn(
            "px-1.5 py-0.5 rounded-full text-[8px] font-bold uppercase shrink-0",
            item.type === 'attraction' && "bg-blue-50 text-blue-600",
            item.type === 'restaurant' && "bg-orange-50 text-orange-600",
            item.type === 'transport' && "bg-gray-100 text-gray-600",
            item.type === 'flight' && "bg-zen-accent/10 text-zen-accent",
          )}>
            {item.type}
          </div>
        </div>

        <h3 className={cn("font-medium text-zen-ink leading-tight mb-1", isSplit ? "text-[11px]" : "text-base")}>
          {item.title}
        </h3>

        {item.location && !isSplit && (
          <div className="flex flex-col gap-2 mt-2">
            <div className="flex items-start gap-1.5 text-xs text-zen-muted">
              <MapPin size={14} className="mt-0.5 shrink-0" />
              <span>{item.location}</span>
            </div>
            
            <a 
              href={getMapsLink(item.location)}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-zen-bg border border-zen-border rounded-lg text-xs font-medium text-zen-ink hover:bg-zen-border transition-colors w-fit"
            >
              <Navigation size={12} />
              <span>導航</span>
            </a>
          </div>
        )}

        {item.location && isSplit && (
           <div className="flex items-center gap-1 mt-1 text-[9px] text-zen-muted">
              <MapPin size={10} />
              <span className="truncate">{item.location}</span>
           </div>
        )}

        {item.participants.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1">
            {item.participants.map(p => (
              <span 
                key={p} 
                className={cn(
                  "text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase tracking-tighter",
                  item.isSplit ? "bg-zen-accent text-white border-zen-accent" : "bg-zen-bg text-zen-muted border-zen-border"
                )}
              >
                {p}
              </span>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}
