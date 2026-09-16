import { ApiError } from "./ApiError.js";

const dateRangeAliases = {
    last7days: "last7Days",
    last30days: "last30Days",
    last3months: "last3Months",
    thismonth: "thisMonth",
    lastmonth: "lastMonth",
    thisyear: "thisYear",
};

const validDateRanges = new Set([
    "today",
    "yesterday",
    "last7Days",
    "last30Days",
    "thisMonth",
    "lastMonth",
    "last3Months",
    "thisYear",
]);

const getUtcDay = (date) =>
    new Date(
        Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())
    );

export const getCreatedAtRange = ({ dateRange, startDate, endDate }) => {
    if (startDate || endDate) {
        const start = startDate ? new Date(`${startDate}T00:00:00.000Z`) : null;
        const end = endDate ? new Date(`${endDate}T23:59:59.999Z`) : null;
        if (
            (start && Number.isNaN(start.getTime())) ||
            (end && Number.isNaN(end.getTime()))
        ) {
            throw new ApiError(400, "Invalid custom date range");
        }
        if (start && end && start > end) {
            throw new ApiError(400, "Start date must be before end date");
        }
        return { ...(start && { $gte: start }), ...(end && { $lte: end }) };
    }

    if (!dateRange) return null;
    dateRange = dateRangeAliases[dateRange] || dateRange;
    if (!validDateRanges.has(dateRange))
        throw new ApiError(400, "Invalid date range");

    const start = getUtcDay(new Date());
    const end = new Date(start);
    end.setUTCDate(end.getUTCDate() + 1);

    if (dateRange === "yesterday") {
        start.setUTCDate(start.getUTCDate() - 1);
        end.setUTCDate(end.getUTCDate() - 1);
    } else if (dateRange === "last7Days" || dateRange === "last30Days") {
        start.setUTCDate(
            start.getUTCDate() - (dateRange === "last7Days" ? 6 : 29)
        );
    } else if (dateRange === "thisMonth") {
        start.setUTCDate(1);
    } else if (dateRange === "lastMonth") {
        start.setUTCMonth(start.getUTCMonth() - 1, 1);
        end.setUTCDate(1);
    } else if (dateRange === "last3Months") {
        start.setUTCMonth(start.getUTCMonth() - 2, 1);
    } else if (dateRange === "thisYear") {
        start.setUTCMonth(0, 1);
    }

    return { $gte: start, $lt: end };
};

export const buildVideoQuery = (query = {}, base = {}) => {
    const { type, status, dateRange, startDate, endDate } = query;
    const conditions = [base];
    const createdAt = getCreatedAtRange({ dateRange, startDate, endDate });
    if (createdAt) conditions.push({ createdAt });
    if (type === "shorts") {
        conditions.push({
            $or: [{ isShort: true }, { duration: { $lte: 60 } }],
        });
    } else if (type === "videos" || type === "long") {
        conditions.push({ isShort: { $ne: true }, duration: { $gt: 60 } });
    } else if (type && type !== "all") {
        throw new ApiError(400, "Invalid content type");
    }
    if (status === "published") conditions.push({ isPublished: true });
    else if (status === "draft") conditions.push({ isPublished: false });
    else if (status && status !== "all")
        throw new ApiError(400, "Invalid status");
    return conditions.length === 1 ? conditions[0] : { $and: conditions };
};

export const getVideoSort = (sortBy = "newest", sortOrder) => {
    const fields = {
        newest: "createdAt",
        oldest: "createdAt",
        updated: "updatedAt",
        recentlyUpdated: "updatedAt",
        mostViewed: "views",
        most_viewed: "views",
        mostLiked: "likesCount",
        most_liked: "likesCount",
        mostCommented: "commentsCount",
        most_commented: "commentsCount",
    };
    if (!fields[sortBy]) throw new ApiError(400, "Invalid sort option");
    const direction = sortOrder === "asc" || sortBy === "oldest" ? 1 : -1;
    return { [fields[sortBy]]: direction, _id: direction };
};
