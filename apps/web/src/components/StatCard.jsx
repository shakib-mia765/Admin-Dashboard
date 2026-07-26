import { useEffect, useId, useMemo, useRef, useState } from "react";

const CARD_VARIANTS = Object.freeze({
    default: "border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950",
    primary: "border-blue-200 bg-blue-50/60 dark:border-blue-900/60 dark:bg-blue-950/20",
    success: "border-emerald-200 bg-emerald-50/60 dark:border-emerald-900/60 dark:bg-emerald-950/20",
    warning: "border-amber-200 bg-amber-50/60 dark:border-amber-900/60 dark:bg-amber-950/20",
    danger: "border-red-200 bg-red-50/60 dark:border-red-900/60 dark:bg-red-950/20"
});

const ICON_VARIANTS = Object.freeze({
    default: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
    primary: "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300",
    success: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300",
    warning: "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300",
    danger: "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300"
});

const TREND_VARIANTS = Object.freeze({
    positive: "text-emerald-600 dark:text-emerald-400",
    negative: "text-red-600 dark:text-red-400",
    neutral: "text-slate-500 dark:text-slate-400"
});

const DEFAULT_FORMAT_OPTIONS = Object.freeze({
    notation: "compact",
    maximumFractionDigits: 1
});

const EMPTY_METRIC = Object.freeze({
    title: "",
    value: null,
    description: "",
    trend: null,
    trendLabel: "",
    series: []
});

const joinClasses = (...classes) => classes.filter(Boolean).join(" ");

const normalizeError = (reason) => {
    if (reason instanceof Error && reason.message.trim()) return reason.message;
    if (typeof reason === "string" && reason.trim()) return reason;
    return "Unable to load this metric.";
};

const toFiniteNumber = (value) => {
    const number = Number(value);
    return Number.isFinite(number) ? number : null;
};

const resolveTrend = (value) => {
    const number = toFiniteNumber(value);
    if (number === null || number === 0) return "neutral";
    return number > 0 ? "positive" : "negative";
};

const formatNumber = (value, options = {}) => {
    if (value === null || value === undefined) return "—";
    if (typeof value !== "number" || !Number.isFinite(value)) return String(value);
    const {
        locale = "en-US",
        style = "decimal",
        currency = "USD",
        suffix = "",
        prefix = "",
        ...intlOptions
    } = options;

    try {
        const formatted = new Intl.NumberFormat(locale, {
            ...DEFAULT_FORMAT_OPTIONS,
            ...intlOptions,
            style,
            ...(style === "currency" ? { currency } : {})
        }).format(value);

        return `${prefix}${formatted}${suffix}`;
    } catch {
        return `${prefix}${value}${suffix}`;
    }
};

const formatTrend = (value) => {
    const number = toFiniteNumber(value);
    if (number === null) return "—";
    return `${Math.abs(number).toLocaleString("en-US", { maximumFractionDigits: 1 })}%`;
};

const normalizeSeries = (series) => Array.isArray(series)
    ? series.map(toFiniteNumber).filter((value) => value !== null)
    : [];
const normalizeMetric = (source = {}) => ({
    ...EMPTY_METRIC,
    ...source,
    series: normalizeSeries(source.series)
});

const TrendIcon = ({ direction }) => (
    <svg
        aria-hidden="true"
        viewBox="0 0 20 20"
        className={joinClasses("size-4 shrink-0", direction === "negative" && "rotate-180")}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
    >
        {direction === "neutral"
            ? <path d="M4 10h12" strokeLinecap="round" />
            : <path d="m5 12 5-5 5 5M10 7v8" strokeLinecap="round" strokeLinejoin="round" />
        }
    </svg>
);

const Sparkline = ({ data, label }) => {
    const points = useMemo(() => {
        if (data.length < 2) return "";
        const min = Math.min(...data);
        const max = Math.max(...data);
        const range = max - min || 1;
        return data.map((value, index) => {
            const x = (index / (data.length - 1)) * 100;
            const y = 28 - ((value - min) / range) * 24;
            return `${x},${y}`;
        }).join(" ");
    }, [data]);

    if (!points) return null;
    return (
        <svg
            role="img"
            aria-label={label}
            viewBox="0 0 100 32"
            preserveAspectRatio="none"
            className="h-9 w-24 overflow-visible"
        >
            <polyline
                points={points}
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                vectorEffect="non-scaling-stroke"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
};
const Skeleton = () => (
    <div aria-hidden="true" className="animate-pulse">
        {[["h-3", "w-24"], ["mt-3 h-8", "w-32"], ["mt-3 h-3", "w-20"]].map(([height, width], index) => (
            <div
                key={index}
                className={joinClasses(height, width, "rounded bg-slate-200 dark:bg-slate-800")}
            />
        ))}
    </div>
);

const StatCard = ({
    title,
    value,
    description,
    icon,
    trend,
    trendLabel,
    series = [],
    loader,
    loaderKey,
    variant = "default",
    formatOptions,
    loading = false,
    disabled = false,
    onClick,
    className = ""
}) => {
    const descriptionId = useId();
    const requestRef = useRef(0);
    const [remoteData, setRemoteData] = useState(null);
    const [loadingRemote, setLoadingRemote] = useState(false);
    const [actionPending, setActionPending] = useState(false);
    const [error, setError] = useState("");
    useEffect(() => {
        const requestId = ++requestRef.current;
        if (typeof loader !== "function") {
            setRemoteData(null);
            setLoadingRemote(false);
            setError("");
            return undefined;
        }

        const controller = new AbortController();
        const loadMetric = async () => {
            setLoadingRemote(true);
            setError("");
            try {
                const result = await Promise.resolve(loader({ signal: controller.signal }));

                if (requestId !== requestRef.current || controller.signal.aborted) return;

                setRemoteData(normalizeMetric(
                    result && typeof result === "object" ? result : { value: result }
                ));
            } catch (reason) {
                if (requestId === requestRef.current && !controller.signal.aborted) {
                    setError(normalizeError(reason));
                }
            } finally {
                if (requestId === requestRef.current && !controller.signal.aborted) {
                    setLoadingRemote(false);
                }
            }
        };

        loadMetric();
        return () => {
            controller.abort();
            requestRef.current += 1;
        };
    }, [loader, loaderKey]);

    const metric = useMemo(() => normalizeMetric({
        title: remoteData?.title ?? title,
        value: remoteData?.value ?? value,
        description: remoteData?.description ?? description,
        trend: remoteData?.trend ?? trend,
        trendLabel: remoteData?.trendLabel ?? trendLabel,
        series: remoteData?.series ?? series
    }), [description, remoteData, series, title, trend, trendLabel, value]);
    const trendDirection = resolveTrend(metric.trend);
    const formattedValue = formatNumber(metric.value, formatOptions);
    const formattedTrend = formatTrend(metric.trend);
    const interactive = typeof onClick === "function";
    const busy = loading || loadingRemote || actionPending;
    const Component = interactive ? "button" : "article";
    const accessibleLabel = [
        metric.title,
        formattedValue,
        metric.trend !== null ? `${formattedTrend} ${trendDirection}` : "",
        error
    ].filter(Boolean).join(", ");

    const handleClick = async () => {
        if (!interactive || disabled || busy) return;
        setActionPending(true);
        setError("");
        try {
            await Promise.resolve(onClick(metric));
        } catch (reason) {
            setError(normalizeError(reason));
        } finally {
            setActionPending(false);
        }
    };

    return (
        <Component
            type={interactive ? "button" : undefined}
            disabled={interactive ? disabled || busy : undefined}
            aria-label={interactive ? accessibleLabel : undefined}
            aria-describedby={metric.description || error ? descriptionId : undefined}
            aria-busy={busy}
            onClick={interactive ? handleClick : undefined}
            className={joinClasses(
                "group relative w-full overflow-hidden rounded-2xl border p-5 text-left shadow-sm transition",
                CARD_VARIANTS[variant] ?? CARD_VARIANTS.default,
                interactive && "cursor-pointer hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 dark:ring-offset-slate-950",
                className
            )}
        >
            {busy ? <Skeleton /> : (
                <>
                    <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-slate-500 dark:text-slate-400">
                                {metric.title || "Untitled metric"}
                            </p>
                            <p className="mt-2 truncate text-3xl font-bold tracking-tight text-slate-950 dark:text-white">
                                {formattedValue}
                            </p>
                        </div>
                        {icon && (
                            <span
                                aria-hidden="true"
                                className={joinClasses(
                                    "grid size-11 shrink-0 place-items-center rounded-xl",
                                    ICON_VARIANTS[variant] ?? ICON_VARIANTS.default
                                )}
                            >
                                {icon}
                            </span>
                        )}
                    </div>

                    <div className="mt-4 flex items-end justify-between gap-3">
                        <div className="min-w-0">
                            {metric.trend !== null && (
                                <div className={joinClasses(
                                    "flex min-w-0 items-center gap-1 text-sm font-semibold",
                                    TREND_VARIANTS[trendDirection]
                                )}>
                                    <TrendIcon direction={trendDirection} />
                                    <span>{formattedTrend}</span>
                                    {metric.trendLabel && (
                                        <span className="truncate font-normal text-slate-500 dark:text-slate-400">
                                            {metric.trendLabel}
                                        </span>
                                    )}
                                </div>
                            )}

                            {(metric.description || error) && (
                                <p
                                    id={descriptionId}
                                    role={error ? "alert" : undefined}
                                    className={joinClasses(
                                        "mt-1 truncate text-sm",
                                        error
                                            ? "text-red-600 dark:text-red-400"
                                            : "text-slate-500 dark:text-slate-400"
                                    )}
                                >
                                    {error || metric.description}
                                </p>
                            )}
                        </div>
                        {metric.series.length > 1 && (
                            <div className={joinClasses("shrink-0", TREND_VARIANTS[trendDirection])}>
                                <Sparkline
                                    data={metric.series}
                                    label={`${metric.title || "Metric"} trend`}
                                />
                            </div>
                        )}
                    </div>
                </>
            )}
        </Component>
    );
};

export default StatCard;