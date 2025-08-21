export default function Track({ track }) {
    return (
        <div>
            <div><strong>{track.name}</strong></div>
            <div>{track.artist}</div>
            <div>{track.album}</div>    
        </div>
    )
}