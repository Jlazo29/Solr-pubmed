from flask import Flask, render_template, request, url_for
from jinja2 import Environment
import math


# generate facet query for stock Solr request handler
# see http://wiki.apache.org/solr/SolrFacetingOverview#line-9
def get_facet_query(facet_field, facet_value):
    return u"{0}:\"{1}\"".format(facet_field, facet_value)


# TODO: Flask-Appconfig
def create_app():
    app = Flask(__name__)
    # app.config['SERVER_NAME'] = 'localhost:5002'

    @app.route('/', methods=['GET'])
    def index():
        return render_template('index.html')

    app.jinja_env.globals.update(max=max)
    app.jinja_env.globals.update(min=min)
    app.jinja_env.globals.update(ceil=math.ceil)
    app.jinja_env.add_extension('jinja2.ext.loopcontrols')

    return app


if __name__ == '__main__':
    create_app().run(debug=True)