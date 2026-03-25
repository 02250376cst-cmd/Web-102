const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const { posts, users } = require('../utils/mockData');

// @desc    Get all posts
// @route   GET /posts
// @access  Public
exports.getPosts = asyncHandler(async (req, res, next) => {
    //pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const total = posts.length;

    //get paginated results
    const results = posts.slice(startIndex, endIndex);

    //enhance posts with user data
    const enhancedResults = results.map(post => {
        const user = users.find(user => user.id === post.user_id);
        return {
            ...post,
            user: {
                id: user.id,
                username: user.username,
                full_name: user.full_name,
                profile_picture: user.profile_picture
            }
        }
    });

    //pagination result
    const pagination = {};
    if (endIndex < total) {
        pagination.next = {
            page: page + 1,
            limit
        }
    }

    if (startIndex > 0) {
        pagination.prev = {
            page: page - 1,
            limit
        }
    }

    res.status(200).json({
        success: true,
        count: enhancedResults.length,
        page,
        total_pages: Math.ceil(total / limit),
        pagination,
        data: enhancedResults
    });
});

// @desc    Get single post
// @route   GET /posts/:id
// @access  Public
exports.getPost = asyncHandler(async (req, res, next) => {
    const post = posts.find(post => post.id === (req.params.id));

    if (!post) {
        return next(
            new ErrorResponse(`Post not found with id of ${req.params.id}`, 404)
        );
    }
    //enhance post with user data
    const user = users.find(user => user.id === post.user_id);
    const enhancedPost = {
        ...post,
        user: {
            id: user.id,
            username: user.username,
            full_name: user.full_name,
            profile_picture: user.profile_picture
        }
    };

    res.status(200).json({
        success: true,
        data: enhancedPost
    });
});

// @desc    Create new post
// @route   POST /api/posts
// @access  private(we will simulate this)

exports.createPost = asyncHandler(async(req, res, next) => {
    // simulate authentication
    const userId = req.header ('x-user-id');
    if (!userId) {
        return next(new ErrorResponse('Not authorized to access this route', 401));
    }

    const newPost = {
        id: (posts.length + 1).toString(),
        caption: req.body.caption,
        image: req.body.image,
        user_id: userId,
        created_at: new Date().toISOString().slice(0, 10)
    }

    posts.push(newPost);

    res.status(201).json({
        success: true,
        data: newPost
    });
});

// @desc    Update post
// @route   PUT /posts/:id
// @access  private(we will simulate this)
exports.updatePost = asyncHandler(async (req, res, next) => {
    // simulate authentication
    const userId = req.header('x-user-id');
    if (!userId) {
        return next(new ErrorResponse('Not authorized to access this route', 401));
    }

    let post = posts.find(post => post.id === req.params.id);

    if (!post) {
        return next(
            new ErrorResponse(`Post not found with id of ${req.params.id}`, 404)
        );
    }

    //check if user owns the post
    if (post.user_id !== userId) {
        return next(new ErrorResponse('Not authorized to update this post', 401));
    }

    //check if user owns the post
    if (post.user_id !== userId) {
        return next(new ErrorResponse('Not authorized to update this post', 401));
    }

    //check if the user own the post
    if (post.user_id !== userId) {
        return next(new ErrorResponse('Not authorized to update this post', 401));
    }

    //update post
    const index = posts.indexOf(post => post.id === req.params.id);

    posts[index] = {
        ...post,
        ...req.body,
        id: post.id, // Ensure id doesnt change
        user_id: post.user_id // Ensure user_id doesnt change
    };

    res.status(200).json({
        success: true,
        data: posts[index]
    });
});

// @desc    Delete post
// @route   DELETE /posts/:id
// @access  private(we will simulate this)
exports.deletePost = asyncHandler(async (req, res, next) => {
    // simulate authentication
    const userId = req.header('x-user-id');
    if (!userId) {
        return next(new ErrorResponse('Not authorized to access this route', 401));
    }

    const post = posts.find(post => post.id === req.params.id);

    if (!post) {
        return next(
            new ErrorResponse(`Post not found with id of ${req.params.id}`, 404)
        );
    }

    //check if user owns the post
    if (post.user_id !== userId) {
        return next(new ErrorResponse('Not authorized to delete this post', 401));
    }

    //delete post
    const index = posts.indexOf(post);
    posts.splice(index, 1);

    res.status(200).json({
        success: true,
        data: {}
    });
});
