from enum import Enum
class gl(Enum):
    alpha = 'α'
    beta = 'β'
    gamma = 'γ'
    delta = 'δ'
    epsilon = 'ε'
    zeta = 'ζ'
    eta = 'η'
    theta = 'θ'
    iota = 'ι'
    kappa = 'κ'
    lmbda = 'λ'
    mu = 'μ'
    nu = 'ν'
    xi = 'ξ'
    omicron = 'ο'
    pi = 'π'
    rho = 'ρ'
    sigma = 'σ'
    tau = 'τ'
    upsilon = 'υ'
    phi = 'φ'
    chi = 'χ'
    psi = 'ψ'
    omega = 'ω'


    def __call__ (self , literal = '', cap = False):
        retval = self.value
        if cap:
            retval = retval.capitalize()
        return retval + str(literal)

    def __repr__ (self): 
        return self.value


