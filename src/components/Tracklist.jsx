import Track from "./Track.jsx";
import styles from "./Tracklist.module.css";

export default function TrackList({ tracks }) {
    if (!tracks?.length) return <p className={styles.empty}>No results yet.</p>;

    return (
        <div className={styles.wrapper}>
            <div className={styles.header}>
                <div>Title</div>
                <div>Artist</div>
                <div>Album</div>    
            </div>

            {tracks.map((t) => {
                return <Track key={t.id} track={t} />
            })}
        </div>
    );
}