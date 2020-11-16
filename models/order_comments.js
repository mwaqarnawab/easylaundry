/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
	var order_comments = sequelize.define(
		'order_comments',
		{
			oc_id: {
				type: DataTypes.INTEGER(11),
				allowNull: false,
				primaryKey: true,
				autoIncrement: true
			},
			order: {
				type: DataTypes.INTEGER(11),
				allowNull: false,
				references: {
					model: 'orders',
					key: 'order_id'
				}
            },
            order_status: {
				type: DataTypes.INTEGER(11),
				allowNull: false,
				references: {
					model: 'order_status',
					key: 'order_status_id'
				}
            },
            comment_by: {
				type: DataTypes.INTEGER(11),
				allowNull: false,
				references: {
					model: 'users',
					key: 'user_id'
				}
			},
			comment: {
				type: DataTypes.STRING(450),
				allowNull: true
			}
		},
		{
			timestamps: false,
			freezeTableName: true,
			tableName: 'order_comments'
		}
	);

	return order_comments;
};
