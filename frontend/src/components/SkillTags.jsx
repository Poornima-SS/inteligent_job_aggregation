export default function SkillTags({ skills = [], limit = 12 }) {
  const list = (skills || []).filter(Boolean).slice(0, limit);
  if (!list.length) return null;

  return (
    <ul className="skill-tags" aria-label="Skills">
      {list.map((skill) => (
        <li key={skill} className="skill-tag">
          {skill}
        </li>
      ))}
    </ul>
  );
}
