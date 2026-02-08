import React, { useEffect, useState } from 'react';
import { getNbaRedditFeed } from '../services/redditApi';
import { Loader2, MessageSquare, ArrowUpCircle, Clock, ExternalLink, RefreshCw } from 'lucide-react';

const RedditFeed = () => {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [after, setAfter] = useState(null);
    const [error, setError] = useState(null);
    const [hasMore, setHasMore] = useState(true);

    useEffect(() => {
        fetchFeed();
    }, []);

    const fetchFeed = async (loadMore = false) => {
        try {
            if (loadMore) {
                setLoadingMore(true);
            } else {
                setLoading(true);
            }
            setError(null);

            const limit = loadMore ? 20 : 10;
            const afterToken = loadMore ? after : null;
            const data = await getNbaRedditFeed(limit, afterToken);

            if (loadMore) {
                setPosts(prev => [...prev, ...data.posts]);
            } else {
                setPosts(data.posts);
            }

            setAfter(data.after);
            setHasMore(!!data.after);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    };

    const formatTimestamp = (utc) => {
        const date = new Date(utc * 1000);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    if (loading) {
        return (
            <div className="loading-state">
                <Loader2 className="animate-spin" size={40} />
                <p>Fetching latest buzz from r/nba...</p>
            </div>
        );
    }

    if (error && posts.length === 0) {
        return (
            <div className="loading-state">
                <p>Failed to load Reddit feed</p>
                <button onClick={() => fetchFeed(false)} className="retry-button">
                    <RefreshCw size={16} /> Retry
                </button>
            </div>
        );
    }

    return (
        <div className="reddit-view">
            <div className="view-header">
                <h1>Reddit r/nba</h1>
                <p>Trending discussions, highlights, and news from the community.</p>
            </div>

            <div className="reddit-grid">
                {posts.map((post) => (
                    <a key={post.id} href={post.url} target="_blank" rel="noopener noreferrer" className="reddit-card glass-card">
                        <div className="post-header">
                            <div className="post-meta">
                                <span className="post-author">u/{post.author}</span>
                                <span className="dot">•</span>
                                <span className="post-time"><Clock size={12} /> {formatTimestamp(post.created)}</span>
                            </div>
                            <ExternalLink size={16} className="ext-icon" />
                        </div>

                        <div className="post-content">
                            <h3 className="post-title">{post.title}</h3>
                        </div>

                        <div className="post-footer">
                            {post.ups > 0 && (
                                <div className="post-stat">
                                    <ArrowUpCircle size={16} color="var(--nba-red)" />
                                    <span>{post.ups.toLocaleString()}</span>
                                </div>
                            )}
                            {post.num_comments > 0 && (
                                <div className="post-stat">
                                    <MessageSquare size={16} color="var(--accent-color)" />
                                    <span>{post.num_comments.toLocaleString()}</span>
                                </div>
                            )}
                        </div>
                    </a>
                ))}
            </div>

            {hasMore && (
                <div className="load-more-container">
                    <button
                        onClick={() => fetchFeed(true)}
                        disabled={loadingMore}
                        className="load-more-btn"
                    >
                        {loadingMore ? (
                            <>
                                <Loader2 className="animate-spin" size={16} />
                                Loading...
                            </>
                        ) : (
                            'Load More'
                        )}
                    </button>
                </div>
            )}
        </div>
    );
};

export default RedditFeed;
