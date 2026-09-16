export const getPagination = (query = {}, defaultLimit = 10) => {
    const page = Math.max(parseInt(query.page, 10) || 1, 1);
    const limit = Math.max(parseInt(query.limit, 10) || defaultLimit, 1);
    const skip = (page - 1) * limit;

    return { page, limit, skip };
};

export const getPaginationMeta = (total, page, limit) => ({
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
    hasNextPage: page * limit < total,
    hasPrevPage: page > 1,
});

//const meta = getPaginationMeta(totalVideos, page, limit);

export const paginate = async (model, query, options = {}) => {
    const { page, limit, sort = { createdAt: -1 }, populate } = options;
    const skip = (page - 1) * limit;

    let dbQuery = model.find(query).sort(sort).skip(skip).limit(limit);
    if (populate) dbQuery = dbQuery.populate(populate);

    const data = await dbQuery;
    const total = await model.countDocuments(query);

    return {
        data,
        pagination: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        },
    };
};
