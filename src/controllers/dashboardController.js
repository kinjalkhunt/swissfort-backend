import User from '../models/User.js';

const { countDocuments, aggregate, find, findById } = User;

const getDashboard = async (req, res) => {
  try {
    const userRole = req.user.role;
    const userId = req.user.id;

    let dashboardData = {};

    switch (userRole) {
      case 'admin':
        // Admin can see all data
        const totalUsers = await countDocuments();
        const usersByRole = await aggregate([
          { $group: { _id: '$role', count: { $sum: 1 } } }
        ]);
        const recentUsers = await find()
          .sort({ createdAt: -1 })
          .limit(5)
          .select('-password');

        dashboardData = {
          totalUsers,
          usersByRole,
          recentUsers,
          permissions: ['manage_users', 'view_all_data', 'system_settings']
        };
        break;

      case 'manager':
        // Manager can see team data
        const teamUsers = await find({ role: { $in: ['master', 'helper'] } })
          .select('-password');
        const teamStats = await aggregate([
          { $match: { role: { $in: ['master', 'helper'] } } },
          { $group: { _id: '$role', count: { $sum: 1 } } }
        ]);

        dashboardData = {
          teamUsers,
          teamStats,
          permissions: ['manage_team', 'view_team_data', 'assign_tasks']
        };
        break;

      case 'master':
        // Master can see helper data
        const helpers = await find({ role: 'helper' })
          .select('-password');
        const helperStats = {
          totalHelpers: helpers.length,
          activeHelpers: helpers.filter(h => h.isActive).length
        };

        dashboardData = {
          helpers,
          helperStats,
          permissions: ['manage_helpers', 'view_helper_data', 'assign_work']
        };
        break;

      case 'helper':
        // Helper can see only their data
        const helperProfile = await findById(userId).select('-password');
        
        dashboardData = {
          profile: helperProfile,
          permissions: ['view_own_data', 'update_own_profile']
        };
        break;

      default:
        return res.status(403).json({
          success: false,
          message: 'Invalid role'
        });
    }

    res.json({
      success: true,
      message: 'Dashboard data retrieved successfully',
      data: {
        role: userRole,
        dashboard: dashboardData
      }
    });

  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching dashboard data',
      error: error.message
    });
  }
};

const getAllUsers = async (req, res) => {
  try {
    const { role, page = 1, limit = 10 } = req.query;
    const userRole = req.user.role;

    // Only admin can see all users
    if (userRole !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only admin can view all users.'
      });
    }

    let filter = {};
    if (role) {
      filter.role = role;
    }

    const users = await find(filter)
      .select('-password')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const total = await countDocuments(filter);

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching users',
      error: error.message
    });
  }
};

export default {
  getDashboard,
  getAllUsers
};
