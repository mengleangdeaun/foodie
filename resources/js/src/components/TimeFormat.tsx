import React from 'react';

interface TimeFormatProps {
    time: string; // Expected format "HH:mm" or ISO string
    className?: string;
}

const TimeFormat: React.FC<TimeFormatProps> = ({ time, className = '' }) => {
    const formatTime = (timeString: string) => {
        try {
            // Handle "HH:mm" or "HH:mm:ss" format
            if (timeString.includes(':')) {
                const parts = timeString.split(':');
                if (parts.length >= 2) {
                    const hours = parseInt(parts[0]);
                    const minutes = parseInt(parts[1]);

                    const date = new Date();
                    date.setHours(hours);
                    date.setMinutes(minutes);

                    return date.toLocaleTimeString('en-US', {
                        hour: 'numeric',
                        minute: '2-digit',
                        hour12: true
                    });
                }
            }

            // Handle ISO or other date strings
            const date = new Date(timeString);
            if (isNaN(date.getTime())) return timeString;

            return date.toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
            });
        } catch (e) {
            return timeString;
        }
    };

    return (
        <span className={className}>
            {formatTime(time)}
        </span>
    );
};

export default TimeFormat;
