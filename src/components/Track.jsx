import styles from "./Track.module.css";

export default function Track({ track }) {
    return (
        <div className={styles.row}>
            <div className={styles.title}>{track.name}</div>
            <div>{track.artist}</div>
            <div className={styles.album}>{track.album}</div>    
        </div>
    )
}