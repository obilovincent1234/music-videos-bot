const queryHelpers = {
    findByName: async (model, input) => {
        var movie = await model.find({
            name: {
                $regex: input,
                $options: 'i'
            }
        }).select(['name','link','size','quality','release','year','dubbed'])
      
      return movie
    },

}

module.exports = queryHelpers