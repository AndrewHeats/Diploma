export const formatDistance = (m) => (m / 1000).toFixed(1) + ' км';
export const formatTime = (min) => min < 60 ? `${min} хв` : `${Math.floor(min/60)} год ${min%60} хв`;