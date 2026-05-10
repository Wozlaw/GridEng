import string
import numpy as np


def generateId(dsize=2, lsize=3):
    literals = list(string.ascii_uppercase)
    numbers = list(string.digits)
    return "".join(np.random.choice(numbers, size=dsize)) + "".join(np.random.choice(literals, size=lsize))


def getUniqueId(idList=None, dsize=2, lsize=3, count=100):
    if idList is None:
        idList = []
    id = generateId(dsize, lsize)
    c = 0
    while id in idList:
        id = generateId(dsize, lsize)
        if c >= count:
            raise Exception("can't generate unique id")
        c += 1

    idList.append(id)
    return id
