from flask import Flask, jsonify, render_template
from concurrent.futures import ThreadPoolExecutor, as_completed
import threading
import time

app = Flask(__name__)

# DATASET

DEFAULT_PROFILE = {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com"
}


# SITE

class Site:

    def __init__(
        self,
        site_id,
        delay_ms,
        active=True
    ):

        self.site_id = site_id
        self.delay_ms = delay_ms
        self.active = active

        self.lock = threading.Lock()

        # Replicated profile
        self.profile = DEFAULT_PROFILE.copy()

    def acquire_lock(self):

        if not self.active:
            return False

        time.sleep(
            self.delay_ms / 1000
        )

        return self.lock.acquire(
            timeout=1
        )

    def release_lock(self):

        if self.lock.locked():
            self.lock.release()


# QUORUM MANAGER

class QuorumManager:

    WRITE_QUORUM = 2

    def __init__(self, sites):

        self.sites = sites

    def acquire_quorum(self):

        locked_sites = []

        executor = ThreadPoolExecutor(
            max_workers=3
        )

        futures = {
            executor.submit(
                site.acquire_lock
            ): site
            for site in self.sites
        }

        try:

            for future in as_completed(
                futures
            ):

                site = futures[future]

                try:

                    if future.result():

                        locked_sites.append(
                            site
                        )

                except Exception:
                    pass

                # Majority reached
                if len(
                    locked_sites
                ) >= self.WRITE_QUORUM:

                    executor.shutdown(
                        wait=False,
                        cancel_futures=True
                    )

                    return locked_sites

        finally:

            executor.shutdown(
                wait=False,
                cancel_futures=True
            )

        return None

    def release_quorum(
        self,
        locked_sites
    ):

        for site in locked_sites:
            site.release_lock()


# SCENARIO FACTORY

def create_cluster(
    scenario
):

    if scenario == "healthy":

        return [

            Site(
                1,
                20
            ),

            Site(
                2,
                25
            ),

            Site(
                3,
                30
            )

        ]

    elif scenario == "slow":

        return [

            Site(
                1,
                20
            ),

            Site(
                2,
                25
            ),

            Site(
                3,
                500
            )

        ]

    elif scenario == "down":

        return [

            Site(
                1,
                20
            ),

            Site(
                2,
                25
            ),

            Site(
                3,
                0,
                False
            )

        ]

    elif scenario == "fail":

        return [

            Site(
                1,
                20
            ),

            Site(
                2,
                0,
                False
            ),

            Site(
                3,
                0,
                False
            )

        ]

    return create_cluster(
        "healthy"
    )


# SCENARIO DATA

def get_scenario_data(
    scenario
):

    sites = create_cluster(
        scenario
    )

    return {

        "scenario":
            scenario,

        "sites": [

            {

                "id":
                    site.site_id,

                "delay":
                    site.delay_ms,

                "active":
                    site.active

            }

            for site in sites

        ]
    }


# BENCHMARK

def run_benchmark(
    scenario,
    tx_count=50
):

    sites = create_cluster(
        scenario
    )

    quorum = QuorumManager(
        sites
    )

    latencies = []

    success_count = 0

    logs = []

    benchmark_start = (
        time.perf_counter()
    )

    for tx in range(
        1,
        tx_count + 1
    ):

        tx_start = (
            time.perf_counter()
        )

        locked = (
            quorum.acquire_quorum()
        )

        if locked:

            success_count += 1

            # =====================================
            # UPDATE USER PROFILE
            # =====================================

            new_name = (
                f"User-{tx}"
            )

            for site in locked:

                site.profile[
                    "name"
                ] = new_name

            latency = (

                time.perf_counter()
                - tx_start

            ) * 1000

            latencies.append(
                latency
            )

            logs.append(

                f"TX-{tx}: "
                f"Updated Profile -> "
                f"{new_name}"

            )

            quorum.release_quorum(
                locked
            )

        else:

            logs.append(

                f"TX-{tx}: "
                f"FAILED "
                f"(No Majority)"

            )

    total_time = round(

        time.perf_counter()
        - benchmark_start,
        3   
             
    )

    avg_latency = (

        sum(latencies)
        / len(latencies)

        if latencies else 0

    )

    throughput = (

        round(
            success_count / total_time,
            2
        )

        if total_time > 0

        else 0

    )

  

    success_rate = (

        success_count
        / tx_count
        * 100

    )

    current_profile = (
        sites[0].profile.copy()
    )

    return {

        "scenario":
            scenario,

        "latency":
            round(
                avg_latency,
                2
            ),

        "throughput":
            throughput,
            

        "success_rate":
            round(
                success_rate,
                2
            ),

        "benchmark_time":
            total_time,

        "total_transactions":
            tx_count,

        "successful_transactions":
            success_count,

        "current_profile":
            current_profile,

        "sites": [

            {

                "id":
                    site.site_id,

                "delay":
                    site.delay_ms,

                "active":
                    site.active

            }

            for site in sites

        ],

        "logs":
            logs[-20:]
    }


# ROUTES

@app.route("/")
def home():

    return render_template(
        "index.html"
    )


@app.route(
    "/scenario/<scenario>"
)
def scenario_route(
    scenario
):

    return jsonify(

        get_scenario_data(
            scenario
        )

    )


@app.route(
    "/benchmark/<scenario>"
)
def benchmark_route(
    scenario
):

    return jsonify(

        run_benchmark(
            scenario
        )

    )


# RUN ALL BENCHMARKS

@app.route("/benchmark/all")
def benchmark_all():

    healthy = run_benchmark(
        "healthy"
    )

    slow = run_benchmark(
        "slow"
    )

    down = run_benchmark(
        "down"
    )

    fail = run_benchmark(
        "fail"
    )

    return jsonify({

        "healthy":
            healthy,

        "slow":
            slow,

        "down":
            down,

        "fail":
            fail

    })


# MAIN

if __name__ == "__main__":

    app.run(
        debug=True
    )