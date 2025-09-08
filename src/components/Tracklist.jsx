import Track from "./Track.jsx";
import styles from "./Tracklist.module.css";

export default function Tracklist({ tracks, onAdd, onRemove, isRemoval = false, onPreview, playingId }) {
    if (!tracks?.length) return <p className={styles.empty}>No results yet.</p>;

    return (
        <div className={styles.wrapper}>
            <div className={styles.header}>
                <div>Title</div>
                <div>Artist</div>
                <div>Album</div>
                <div></div>    
            </div>

            {tracks.map((t) => ( 
                <Track 
                key={t.id}
                track={t}
                onAdd={onAdd}
                onRemove={onRemove}
                isRemoval={isRemoval}
                onPreview={onPreview}
                playingId={playingId === t.id}
                />
            ))}
        </div>
    );
}