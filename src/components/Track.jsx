import styles from "./Track.module.css";

export default function Track({ track, onAdd, onRemove, isRemoval = false }) {
    return (
        <div className={styles.row}>
            <div className={styles.title}>{track.name}</div>
            <div>{track.artist}</div>
            <div className={styles.album}>{track.album}</div>    

            {onAdd && !isRemoval && (
                <button className={styles.addBtn} onClick={() => onAdd(track)}>+</button>
            )}
            {onRemove && isRemoval && (
                <button className={styles.addBtn} onClick={() => onRemove(track)}>-</button>
            )}
        </div>
    )
}