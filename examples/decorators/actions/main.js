const {Action} = require('../../..');

class _ {
    @Action()
    async testAction() {
        return 1;
    }

    @Action({
        input: {
            name: 'required'
        },
        middleware: [
            'auth:required'
        ]
    })
    async firstAction({ user }) {
        return 2;
    }
}
