export function MinutesChart({ data }: { data: { date: string; minutes: number }[] }) {
  const max = Math.max(10, ...data.map((d) => d.minutes));
  return (
    <figure class="chart">
      <figcaption>Minutes practised, last {data.length} days</figcaption>
      <div class="chart__plot">
        <span class="chart__max">{max} min</span>
        <div class="chart__bars">
          {data.map((d) => (
            <div key={d.date} class="chart__col" role="img" aria-label={`${d.date}: ${d.minutes} minutes`} data-tip={`${d.date}: ${d.minutes} min`}>
              <div class="chart__bar" style={{ height: `${(d.minutes / max) * 100}%` }} />
            </div>
          ))}
        </div>
      </div>
      <div class="chart__axis" aria-hidden="true">
        <span>{data[0]?.date.slice(5)}</span>
        <span>{data.at(-1)?.date.slice(5)}</span>
      </div>
      <details>
        <summary>Show as table</summary>
        <table class="table">
          <thead><tr><th>Date</th><th>Minutes</th></tr></thead>
          <tbody>{data.map((d) => <tr key={d.date}><td>{d.date}</td><td>{d.minutes}</td></tr>)}</tbody>
        </table>
      </details>
    </figure>
  );
}
