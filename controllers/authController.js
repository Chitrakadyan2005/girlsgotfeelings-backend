const User = require('../models/User');

exports.register = async (req, res) => {
  try {
    const { username, secret_phrase } = req.body;

    if (!username || username.trim() === '') {
      return res.status(400).json({ error: 'Username is required' });
    }

    if (!secret_phrase || secret_phrase.length < 6) {
      return res.status(400).json({ error: 'Secret phrase must be at least 6 characters' });
    }

    const user = await User.create( username, secret_phrase); // return user object
    res.json({ token: user.token, username: user.username });

  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { username, secret_phrase } = req.body;
    const user = await User.login(username, secret_phrase); // should return user with token

    res.json({
      token: user.token,
      username: user.username // ✅ always send the correct one
    });
  } catch (err) {
    res.status(401).json({ error: err.message });
  }
};


exports.resetPassword = async (req, res) => {
  try{
    console.log('RESET PASSWORD BODY:', req.body);
    let{username, newPassword} = req.body;
    if(!username || !newPassword){
      return res.status(400).json({error: 'Username and new password are required'});
    }
     username = username.trim().toLowerCase();
    if(newPassword.length < 6){
      return res.status(400).json({error: 'Password must be at least 6 characters'});
    }
    await User.updatePassword(username, newPassword);
    res.status(200).json({message: 'Password updated successfully'});
  }catch(err){
    res.status(400).json({error:err.message});
  }
};

exports.deleteAccount = async (req, res) => {
  try {
    const userId = req.user.id;
    await User.delete(userId);
    res.status(200).json({ message: 'User deleted successfully' });
  } catch (err) {
    console.error('Delete Error:', err);
    res.status(400).json({ error: err.message || 'Something went wrong' });
  }
};
