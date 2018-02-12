<?php
class HomeView {

    public static function show() {
        HeaderView::show("");
        HomeView::showBody();
        FooterView::show();
    }

    public static function showBody() {
        ?>
<div class="jumbotron">
    <h1>Neustart</h1>
    <div>
        <a href="demo" class="btn btn-info btn-lg">
            Do Stuff!
        </a>
    </div>
    <p>
        Hmmm
    </p>
</div>
<div class="row">
    <div class="col-md-9">

        <div class="row">

            <div class="col-md-12">
                <h3>Something</h3>
                <p>
                    Content here
                </p>
            </div>

        </div>

        <section id="screenshots">
            <div class="row">
                <div class="col-md-offset 2 col-md-8">
                    <h3>Something other things</h3>
                </div>
            </div>
            <div class="row">
                <div class="col-sm-6 col-lg-4">
                    <p>one thing</p>
                </div>
                <div class="col-sm-6 col-lg-4">
                    <p>two thing</p>
                </div>
                <div class="col-sm-6 col-sm-offset-3 col-lg-4 col-lg-offset-0">
                    <p>three thing</p>
                </div>
            </div>
        </section>

    </div>

    <div class="col-md-3">
        <aside id="faq">
            <h2>Frequently Asked Questions</h2>
            <ul class="list-unstyled list-group">
                <li class="list-group-item"><a href="faq#use">Should I use this site?</a></li>
                <li class="list-group-item"><a href="faq#purpose">Why does this site exist?</a></li>
            </ul>
            <a href="faq">More Questions ...</a>
        </aside>
    </div>

</div><!-- end of row -->



<?php
    }
}
?>