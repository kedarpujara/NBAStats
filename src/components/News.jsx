import React, { useEffect, useState } from 'react';
import { getNbaNews } from '../services/espnApi';
import { Loader2, ExternalLink, Clock, ChevronDown } from 'lucide-react';

const INITIAL_LIMIT = 15;
const MAX_LIMIT = 30;

const News = () => {
    const [articles, setArticles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [currentLimit, setCurrentLimit] = useState(INITIAL_LIMIT);
    const [hasMore, setHasMore] = useState(true);

    const fetchNews = async (limit) => {
        const data = await getNbaNews(limit);
        if (data && data.articles) {
            setArticles(data.articles);
            setHasMore(data.articles.length >= limit && limit < MAX_LIMIT);
        }
    };

    useEffect(() => {
        const init = async () => {
            setLoading(true);
            await fetchNews(INITIAL_LIMIT);
            setLoading(false);
        };
        init();
    }, []);

    const loadMore = async () => {
        setLoadingMore(true);
        const newLimit = Math.min(currentLimit + 15, MAX_LIMIT);
        await fetchNews(newLimit);
        setCurrentLimit(newLimit);
        setLoadingMore(false);
    };

    const formatDate = (dateStr) => {
        return new Date(dateStr).toLocaleDateString([], { 
            month: 'short', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (loading) {
        return (
            <div className="loading-state">
                <Loader2 className="animate-spin" size={40} />
                <p>Gathering the latest headlines...</p>
            </div>
        );
    }

    return (
        <div className="news-view">
            <div className="view-header">
                <h1>Injuries & News</h1>
                <p>Get the latest updates on trades, injuries, and game recaps from across the league.</p>
            </div>

            <div className="news-grid">
                {articles.map((article) => (
                    <article key={article.id} className="news-card glass-card">
                        {article.images?.[0] && (
                            <div className="news-image-wrap">
                                <img src={article.images[0].url} alt="" className="news-image" />
                            </div>
                        )}
                        <div className="news-content">
                            <div className="news-meta">
                                <span className="news-type">{article.type}</span>
                                <span className="news-date"><Clock size={12} /> {formatDate(article.published)}</span>
                            </div>
                            <h3 className="news-headline">{article.headline}</h3>
                            <p className="news-description">{article.description}</p>
                            <a 
                                href={article.links?.web?.href || '#'} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="news-link"
                            >
                                Read Full Story <ExternalLink size={14} />
                            </a>
                        </div>
                    </article>
                ))}
            </div>

            {hasMore && (
                <div className="load-more-container">
                    <button
                        className="load-more-btn"
                        onClick={loadMore}
                        disabled={loadingMore}
                    >
                        {loadingMore ? (
                            <>
                                <Loader2 className="animate-spin" size={16} />
                                Loading...
                            </>
                        ) : (
                            <>
                                <ChevronDown size={16} />
                                Load More Articles
                            </>
                        )}
                    </button>
                </div>
            )}
        </div>
    );
};

export default News;
