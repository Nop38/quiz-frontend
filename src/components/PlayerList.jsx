export default function PlayerList({ players = [] }) {
  return (
    <ul className="space-y-1 text-sm">
      {players.map((p) => (
        <li key={p.token} className="flex justify-between">
          <span>{p.name}</span>
          <span className="font-semibold">{Number(p.score ?? 0).toFixed(2)} pts</span>
        </li>
      ))}
    </ul>
  );
}
