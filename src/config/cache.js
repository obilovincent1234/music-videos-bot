module.exports = {
	store: require("cache-manager-fs-hash"),
	options: {
		path: "./temp",
		ttl: 10 * 60,
		maxsize: 1024,
		subdirs: false,
		zip: true,
	},
};
