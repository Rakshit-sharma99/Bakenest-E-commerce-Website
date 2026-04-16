import User from '../models/User.js';

// ── Admin: List all users ──────────────────────────────────────────────────
export const getUsers = async (req, res) => {
  const { search = '' } = req.query;
  const query = search
    ? {
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { phone: { $regex: search, $options: 'i' } },
        ],
      }
    : {};

  const users = await User.find(query).select('-password').sort({ createdAt: -1 });
  return res.json(users);
};

// ── Admin: Get single user by ID ───────────────────────────────────────────
export const getUserById = async (req, res) => {
  const user = await User.findById(req.params.id).select('-password');
  if (!user) return res.status(404).json({ message: 'User not found' });
  return res.json(user);
};

// ── User: Get own profile ──────────────────────────────────────────────────
export const getMyProfile = async (req, res) => {
  const user = await User.findById(req.user._id).select('-password');
  if (!user) return res.status(404).json({ message: 'User not found' });
  return res.json(user);
};

// ── User: Update own profile (name, phone) ─────────────────────────────────
export const updateMyProfile = async (req, res) => {
  const { name, phone } = req.body;
  const user = await User.findById(req.user._id);
  if (!user) return res.status(404).json({ message: 'User not found' });

  if (name && name.trim()) user.name = name.trim();
  if (phone !== undefined) user.phone = phone.trim();

  const updated = await user.save();
  const { password: _, ...safeUser } = updated.toObject();
  return res.json({ message: 'Profile updated', user: safeUser });
};

// ── User: Get all saved addresses ──────────────────────────────────────────
export const getMyAddresses = async (req, res) => {
  const user = await User.findById(req.user._id).select('addresses');
  if (!user) return res.status(404).json({ message: 'User not found' });
  return res.json(user.addresses || []);
};

// ── User: Add a new address ────────────────────────────────────────────────
export const addAddress = async (req, res) => {
  const { label, fullName, phone, line1, line2, city, state, postalCode, country, isDefault } = req.body;

  if (!fullName || !phone || !line1 || !city || !postalCode || !country) {
    return res.status(400).json({ message: 'fullName, phone, line1, city, postalCode, and country are required' });
  }

  const user = await User.findById(req.user._id);
  if (!user) return res.status(404).json({ message: 'User not found' });

  // If this address is being set as default, unset all others
  if (isDefault) {
    user.addresses.forEach((addr) => { addr.isDefault = false; });
  }

  user.addresses.push({ label, fullName, phone, line1, line2, city, state, postalCode, country, isDefault });
  await user.save();

  return res.status(201).json({ message: 'Address added', addresses: user.addresses });
};

// ── User: Set an address as default ───────────────────────────────────────
export const setDefaultAddress = async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) return res.status(404).json({ message: 'User not found' });

  const addr = user.addresses.id(req.params.addrId);
  if (!addr) return res.status(404).json({ message: 'Address not found' });

  user.addresses.forEach((a) => { a.isDefault = false; });
  addr.isDefault = true;
  await user.save();

  return res.json({ message: 'Default address updated', addresses: user.addresses });
};

// ── User: Delete an address ────────────────────────────────────────────────
export const deleteAddress = async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) return res.status(404).json({ message: 'User not found' });

  const addrIndex = user.addresses.findIndex(
    (a) => a._id.toString() === req.params.addrId
  );
  if (addrIndex === -1) return res.status(404).json({ message: 'Address not found' });

  user.addresses.splice(addrIndex, 1);

  // If no more addresses or no default, set first as default
  if (user.addresses.length > 0 && !user.addresses.some((a) => a.isDefault)) {
    user.addresses[0].isDefault = true;
  }

  await user.save();
  return res.json({ message: 'Address removed', addresses: user.addresses });
};
