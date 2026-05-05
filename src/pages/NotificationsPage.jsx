export default function NotificationsPage() {
  const updates = [
    { initials: 'SK', name: 'Sarah Kim', action: 'joined your team', text: 'Team Alpha now has 5 members!', time: '2 min ago', unread: true },
    { initials: 'AJ', name: 'Alex Johnson', action: 'shared a project update', text: 'The AI chatbot module is ready for testing.', time: '1 hour ago', unread: true },
    { initials: 'MR', name: 'Mike Ross', action: 'commented on your post', text: 'Great idea! Let me know if you need help with the backend.', time: '3 hours ago', unread: false },
    { initials: 'LP', name: 'Lisa Park', action: 'registered for Campus Innovation Sprint', text: '', time: 'Yesterday', unread: false },
  ];

  return (
    <div className="notifs-layout">
      <div className="updates-card">
        <div className="updates-header">
          <h2><i className="fas fa-bell"></i> Recent Updates</h2>
        </div>
        {updates.map((u, i) => (
          <div className="update-item" key={i}>
            <div className="update-avatar">{u.initials}</div>
            <div className="update-body">
              <div><span className="update-name">{u.name}</span> <span className="update-action">{u.action}</span></div>
              {u.text && <div className="update-text">{u.text}</div>}
              <div className="update-time">{u.unread && <span className="unread-dot"></span>} {u.time}</div>
            </div>
          </div>
        ))}
      </div>
      <div className="categories-card">
        <h3><i className="fas fa-filter"></i> Categories</h3>
        {['Team Updates', 'Club Activity', 'Hackathon Alerts', 'Project Mentions', 'Friend Requests'].map(cat => (
          <div className="category-item" key={cat}>
            <span className="category-name">{cat}</span>
            <div className="toggle"><i className="fas fa-check"></i></div>
          </div>
        ))}
      </div>
    </div>
  );
}
