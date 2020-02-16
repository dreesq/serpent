/**
 * Task Schema
 */

module.exports = Schema => {
    return new Schema({
        title: String,
        userId: {
            type: Schema.ObjectId,
            references: 'user'
        },
        test: {
            default: 'test',
            type: String
        }
    });
};
