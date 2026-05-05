const demoPosts = [
  { title: 'Looking for a React teammate', description: 'Our hackathon team is building a student dashboard and needs one frontend-focused member.' },
  { title: 'AI workshop notes shared', description: 'Uploaded notes from the campus AI session — prompts, model comparisons, and project ideas.' },
  { title: 'Open call for project testers', description: 'We need classmates to test our event registration flow and share feedback before the demo.' },
];

export default function PostsPage() {
  return (
    <>
      <h2 style={{ marginBottom: '1.2rem', fontSize: '1.3rem', fontWeight: 700 }}><i className="fas fa-newspaper"></i> Posts</h2>
      <p className="posts-page-intro">Announcements and team updates appear here.</p>
      <div className="posts-page-grid">
        {demoPosts.map((post, i) => (
          <div className="community-post-card" key={i}>
            <div className="community-post-label"><i className="fas fa-bullhorn"></i> Post</div>
            <h3>{post.title}</h3>
            <p>{post.description}</p>
          </div>
        ))}
      </div>
    </>
  );
}
