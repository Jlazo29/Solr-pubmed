from flask import Flask, render_template, request, url_for
from jinja2 import Environment
import math

facet_names = {
    'journal_title': 'Journal',
    'mesh_heading_list': 'MeSH Terms',
    'gene_symbol_list': 'Gene Symbol',
}
results_per_page = 20


# generate facet query for stock Solr request handler
# see http://wiki.apache.org/solr/SolrFacetingOverview#line-9
def get_facet_query(facet_field, facet_value):
    return u"{0}:\"{1}\"".format(facet_field, facet_value)


# TODO: Flask-Appconfig
def create_app():
    app = Flask(__name__)
    # app.config['SERVER_NAME'] = 'localhost:5002'

    @app.template_filter('get_facet_name')
    def get_facet_name(key):
        return facet_names[key]


    @app.template_filter('pluralize')
    def pluralize(number, singular='', plural='s'):
        if number == 1:
            return singular
        else:
            return plural

    @app.template_filter('str_in_url')
    def str_in_url(fq, current):
        result = fq.replace(u"%20", u"+")
        return (result in current) and (len(result) > 1)

    @app.template_filter('debug')
    def debug(e):
        type(e)
        print(e)

    @app.template_filter('format_query')
    def format_query(text):
        result = u"id:("
        for tag in text:
            curr = tag.replace(u"java.util.UUID:", u'')
            if tag != text[-1]:
                result = result + curr + u' OR '
            else:
                result = result + curr + u')'
        return result

    @app.template_filter('filter_present')
    def filter_present(lst):
        for i in lst:
            print(i)

    @app.route('/', methods=['GET'])
    def index():
        return render_template('index.html')

    @app.route('/example', methods=['GET'])
    def example():
        return render_template('example.html')

    app.jinja_env.globals.update(max=max)
    app.jinja_env.globals.update(min=min)
    app.jinja_env.globals.update(ceil=math.ceil)
    app.jinja_env.globals.update(get_fq=get_facet_query)
    app.jinja_env.add_extension('jinja2.ext.loopcontrols')

    return app


if __name__ == '__main__':
    create_app().run(debug=True)