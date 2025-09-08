import styles from "./Track.module.css";

export default function Track({ track, onAdd, onRemove, isRemoval = false, onPreview, isPlaying = false }) {
    return (
        <div className={styles.row}>
            <div className={styles.title}>{track.name}</div>
            <div>{track.artist}</div>
            <div className={styles.album}>{track.album}</div>    
            <div className={styles.action}>
                {onPreview && (
                   <button
                    className={styles.actionBtn}
                    onClick={() => onPreview(track)}
                    disabled={!track.previewUrl}
                    title={track.previewUrl ? (isPlaying ? "Pause preview" : "Play preview") : "No preview available"}>
                        {isPlaying ? "⏸" : "▶"}
                    </button>
       )}
                {onAdd && !isRemoval && (
                    <button className={styles.actionBtn} onClick={() => onAdd(track)}>+</button>
                )}
                {onRemove && isRemoval && (
                    <button className={styles.actionBtn} onClick={() => onRemove(track)}>-</button>
                )}
            </div>    
        </div>
    )
}