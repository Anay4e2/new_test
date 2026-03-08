import { FC, useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, MapPin, Landmark, Package } from 'lucide-react';
import { globalSearchApi, SearchResults } from '@/services/api';

export const GlobalSearch: FC = () => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResults | null>(null);
    const [loading, setLoading] = useState(false);
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);
    const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);
    const navigate = useNavigate();

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const handleSearch = (value: string) => {
        setQuery(value);
        if (debounceRef.current) clearTimeout(debounceRef.current);
        if (value.trim().length < 2) { setResults(null); setOpen(false); return; }
        debounceRef.current = setTimeout(async () => {
            setLoading(true);
            try {
                const res = await globalSearchApi(value.trim(), 5);
                if (res.success) { setResults(res.results); setOpen(true); }
            } catch { /* ignore */ }
            setLoading(false);
        }, 300);
    };

    const close = () => { setOpen(false); setQuery(''); setResults(null); };
    const hasResults = results && (results.cities.length + results.places.length + results.packages.length > 0);

    return (
        <div ref={ref} className="relative hidden md:block">
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus-within:ring-2 focus-within:ring-blue-500 transition-all w-48 lg:w-56">
                <Search size={14} className="text-slate-400 shrink-0" />
                <input
                    type="text"
                    value={query}
                    onChange={e => handleSearch(e.target.value)}
                    placeholder="Search cities, places..."
                    className="bg-transparent text-xs text-slate-700 dark:text-slate-200 placeholder-slate-400 outline-none w-full"
                />
                {query && (
                    <button onClick={close} className="text-slate-400 hover:text-slate-600">
                        <X size={12} />
                    </button>
                )}
            </div>

            {open && (
                <div className="absolute top-full mt-2 right-0 w-80 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 z-50 max-h-96 overflow-y-auto">
                    {loading && <p className="text-xs text-slate-400 p-3 text-center">Searching...</p>}
                    {!loading && !hasResults && <p className="text-xs text-slate-400 p-3 text-center">No results found</p>}
                    {!loading && hasResults && (
                        <>
                            {results!.cities.length > 0 && (
                                <div>
                                    <p className="text-[10px] font-semibold text-slate-400 uppercase px-3 pt-2 pb-1">Cities</p>
                                    {results!.cities.map(c => (
                                        <button key={c._id} onClick={() => { close(); navigate('/plan'); }} className="flex items-center gap-2 w-full px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-700 text-left">
                                            <MapPin size={14} className="text-blue-500 shrink-0" />
                                            <div>
                                                <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{c.name}</p>
                                                <p className="text-[10px] text-slate-400">{c.state}</p>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                            {results!.places.length > 0 && (
                                <div>
                                    <p className="text-[10px] font-semibold text-slate-400 uppercase px-3 pt-2 pb-1">Places</p>
                                    {results!.places.map(p => (
                                        <button key={p._id} onClick={() => { close(); navigate('/plan'); }} className="flex items-center gap-2 w-full px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-700 text-left">
                                            <Landmark size={14} className="text-amber-500 shrink-0" />
                                            <div>
                                                <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{p.name}</p>
                                                <p className="text-[10px] text-slate-400">{p.cityName} &middot; {p.type}</p>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                            {results!.packages.length > 0 && (
                                <div>
                                    <p className="text-[10px] font-semibold text-slate-400 uppercase px-3 pt-2 pb-1">Packages</p>
                                    {results!.packages.map(pkg => (
                                        <button key={pkg._id} onClick={() => { close(); navigate(`/packages`); }} className="flex items-center gap-2 w-full px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-700 text-left">
                                            <Package size={14} className="text-emerald-500 shrink-0" />
                                            <div>
                                                <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{pkg.name}</p>
                                                <p className="text-[10px] text-slate-400">{pkg.cities?.join(', ')}</p>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </>
                    )}
                </div>
            )}
        </div>
    );
};
