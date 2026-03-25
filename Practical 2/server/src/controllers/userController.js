const dataStore = require('../models');

//get all users
const getAllUsers = (req, res) => {
    res.status(200).json(dataStore.users);
};

//get user by id
const getUserById = (req, res) => {
    const userId = parseInt(req.params.id);
    const user = dataStore.users.find(u => u.id === userId);

    if (!user) {
        return res.status(404).json({ error: "User not found" });
    }

    res.status(200).json(user);
}

// POST create new user
const createUser = (req, res) => {
    const { username, email, password } = req.body;

    //basic validation
    if (!username || !email) {
        return res.status(400).json({ error: 'username, email and password are required' });
    }

    // check if username or email already exists
    const usernameExists = dataStore.users.some(user => user.username === username);
    const emailExists = dataStore.users.some(user => user.email === email);

    if (usernameExists) {
        return res.status(400).json({ error: 'Username already taken' });
    }

    if (emailExists) {
        return res.status(400).json({ error: 'Email already registered' });
    }

    const newUser = {
        id: dataStore.nextIds.users++,
        username,
        email,
        name: name || username,
        followers:[],
        following:[],
        createdAt: new Date().toISOString()
    };

    dataStore.users.push(newUser);
    res.status(201).json(newUser);

};

// PUT update user
const updateUser = (req, res) => {
    const userId = parseInt(req.params.id);
    const userIndex = dataStore.users.findIndex(u => u.id === userId);

    if (userIndex === -1) {
        return res.status(404).json({ error: 'User not found' });
    }

    const { name, email } = req.body;
    const user = dataStore.users[userIndex];

    // update fields if provided
    if (username) user.name = name;
    if (email) {
        // check if email already used by another user
        const emailExists = dataStore.users.some(u => u.email === email && u.id !== userId);
        if (emailExists) {
            return res.status(409).json({ error: 'Email already registered' });
        }
        user.email = email;
    }

    user.updatedAt = new Date().toISOString();

    res.status(200).json(user);
};

// DELETE a user
const deleteUser = (req, res) => {
    const userId = parseInt(req.params.id);
    const userIndex = dataStore.users.findIndex(u => u.id === userId);

    if (userIndex === -1) {
        return res.status(404).json({ error: 'User not found' });
    }

    //Remove the user
    dataStore.users.splice(userIndex, 1);

    //Also remove user's videos, comments 
    dataStore.videos = dataStore.videos.filter(video => video.userId !== userId);
    dataStore.comments = dataStore.comments.filter(comment => comment.userId !== userId);

    //Remove user from followers/following lists
    dataStore.users.forEach(user => {
        user.followers = user.followers.filter(id => id !== userId);
        user.following = user.following.filter(id => id !== userId);
        });
    res.status(204).end();

    };

    //get user videos
const getUserVideos = (req, res) => {
    const userId = parseInt(req.params.id);
    const user = dataStore.users.find(u => u.id === userId);

    if (!user) {
        return res.status(404).json({ error: "User not found" });
    }

    const videos = dataStore.videos.filter(v => v.userId === userId);
    res.status(200).json(videos);
};

//get user followers
const getUserFollowers = (req, res) => {
    const userId = parseInt(req.params.id);
    const user = dataStore.users.find(u => u.id === userId);

    if (!user) {
        return res.status(404).json({ error: "User not found" });
    }

    const followers = user.followers.map(followerId => {
        return dataStore.users.find(u => u.id === followerId);
    }).filter(Boolean);

    res.status(200).json(followers);    

};

//POST follow a user
const followUser = (req, res) => {
    const userId = parseInt(req.params.id);
    const { followerId } = req.body;

    if (!followerId) {
        return res.status(400).json({ error: 'followerId is required' });
    }

    if (!follwerId){
        return res.status(400).json({ error: 'followerId is required' });
    }

    //cant follow yourself  
    if (userId === followerIdInt) {
        return res.status(400).json({ error: 'users cannot follow themselves' });
    }

    //check if already following
    if (userToFollow.followers.includes(followerIdInt)){
        return res.status(409).json({ error: 'Already following this user' });
    }

    // add follower relationship
    userToFollow.followers.push(followerIdInt);
    follower.following.push(userToFollowId);

    res.status(200).json({ message: 'User followed successfully' });
};

//delete unfollow user 
const unfollowUser = (req, res) => {
    const userToUnfollowId = parseInt(req.params.id);
    const { followerId } = req.body;

    if(!followerId) {
        return res.status(400).json({ error: 'followerId is required' });

    }
   
    const followerIdInt = parseInt(followerId);
    const userToUnfollow = dataStore.users.find(u => u.id === userToUnfollowId);
    const follower = dataStore.users.find(u => u.id === followerIdInt);

    if (!userToUnfollow || !follower) {
        return res.status(404).json({ error: 'User not found' });
    }

    // check if foloowing relationship exits
    const followerIndex = userToUnfollow.followers.indexOf(followerIdInt);
    const followingIndex = follower.following.indexOf(userToUnfollowId);

    if (followerIndex === -1 || followingIndex === -1) {
        return res.status(409).json({ error: 'Not following this user' });
    }

    // Remove follower relationship
    userToUnfollow.followers.splice(followerIndex, 1);
    follower.following.splice(followingIndex, 1);

    res.status(204).json({ message: 'User unfollowed successfully' });

};

module.exports = {
    getAllUsers,
    getUserById,
    createUser,
    updateUser,
    deleteUser,
    getUserVideos,
    getUserFollowers,
    followUser,
    unfollowUser
};

   
